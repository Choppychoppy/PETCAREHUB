import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, IsNull, Brackets } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { Pet } from '../pets/entities/pet.entity';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateStaffAppointmentDto } from './dto/create-staff-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
  ) {}

  /**
   * Kiểm tra nhân viên có bị trùng khung giờ với lịch hẹn khác không.
   * Hai lịch coi là trùng nếu khoảng [bắt đầu, kết thúc) của chúng giao nhau.
   * Bỏ qua các lịch đã huỷ / hoàn thành / vắng mặt và lịch đang sửa (excludeId).
   */
  private async assertNoStaffConflict(
    staffId: string | null | undefined,
    start: Date,
    durationMinutes: number,
    excludeId?: string,
  ): Promise<void> {
    if (!staffId) return;
    const startMs = start.getTime();
    const endMs = startMs + (durationMinutes || 30) * 60000;

    const qb = this.appointmentRepository
      .createQueryBuilder('a')
      .where('a.staffId = :staffId', { staffId })
      .andWhere('a.status NOT IN (:...ignored)', {
        ignored: [
          AppointmentStatus.CANCELLED,
          AppointmentStatus.COMPLETED,
          AppointmentStatus.NO_SHOW,
        ],
      });
    if (excludeId) qb.andWhere('a.id != :excludeId', { excludeId });

    const existing = await qb.getMany();
    const conflict = existing.some((a) => {
      const s = new Date(a.dateTime || a.appointmentDate).getTime();
      const e = s + (a.duration || 30) * 60000;
      return startMs < e && endMs > s; // hai khoảng thời gian giao nhau
    });

    if (conflict) {
      throw new BadRequestException(
        'Nhân viên đã có lịch hẹn trùng khung giờ này. Vui lòng chọn khung giờ khác hoặc nhân viên khác.',
      );
    }
  }

  async create(userId: string, createAppointmentDto: any) {
    const appointment = this.appointmentRepository.create({
      ...createAppointmentDto,
      userId,
      customerType: 'registered',
    });
    return this.appointmentRepository.save(appointment);
  }

  /**
   * Chuẩn hóa số điện thoại để đối chiếu (bỏ khoảng trắng, dấu chấm, gạch nối,
   * và quy đổi tiền tố +84 về 0).
   */
  private normalizePhone(phone?: string): string | null {
    if (!phone) return null;
    let p = phone.replace(/[\s.\-()]/g, '');
    if (p.startsWith('+84')) p = '0' + p.slice(3);
    else if (p.startsWith('84') && p.length >= 10) p = '0' + p.slice(2);
    return p || null;
  }

  /**
   * Admin / nhân viên tạo lịch hẹn cho khách hàng (đã có hoặc chưa có tài khoản).
   * - Admin: được chọn bất kỳ nhân viên phụ trách.
   * - Nhân viên: chỉ được tự tạo cho chính mình (staffId ép về id của họ).
   */
  async createByStaff(creator: User, dto: CreateStaffAppointmentDto) {
    // Phân quyền gán nhân viên phụ trách
    let staffId: string | null = null;
    if (creator.role === UserRole.STAFF) {
      // Nhân viên chỉ được tạo lịch cho chính họ
      staffId = creator.id;
    } else if (creator.role === UserRole.ADMIN) {
      staffId = dto.staffId || null;
      if (staffId) {
        const staff = await this.userRepository.findOne({ where: { id: staffId } });
        if (!staff || (staff.role !== UserRole.STAFF && staff.role !== UserRole.ADMIN)) {
          throw new BadRequestException('Nhân viên được phân công không hợp lệ');
        }
      }
    } else {
      throw new ForbiddenException('Bạn không có quyền tạo lịch hẹn cho khách hàng');
    }

    // Lấy dịch vụ để suy ra giá / thời lượng nếu không truyền vào
    const service = await this.serviceRepository.findOne({
      where: { id: dto.serviceId },
    });
    if (!service) {
      throw new BadRequestException('Dịch vụ không tồn tại');
    }

    const appointmentDate = new Date(dto.appointmentDate);
    const base: Partial<Appointment> = {
      serviceId: dto.serviceId,
      appointmentDate,
      dateTime: appointmentDate,
      duration: dto.duration ?? service.duration ?? 30,
      price: dto.price ?? Number(service.price) ?? 0,
      staffId: staffId || undefined,
      notes: dto.notes,
      specialRequests: dto.specialRequests,
      createdBy: creator.id,
      // Lịch do admin/nhân viên tạo coi như đã xác nhận
      status: AppointmentStatus.CONFIRMED,
      isArchived: dto.isArchived ?? false,
    };

    if (dto.customerType === 'registered') {
      const customer = await this.userRepository.findOne({
        where: { id: dto.userId },
      });
      if (!customer) {
        throw new BadRequestException('Khách hàng không tồn tại');
      }
      base.customerType = 'registered';
      base.userId = dto.userId;
      base.petId = dto.petId || undefined;

      // Thêm thú cưng mới cho khách ngay trong luồng đặt lịch (nếu có)
      if (dto.newPetName && dto.newPetName.trim()) {
        const newPet = this.petRepository.create({
          name: dto.newPetName.trim(),
          species: (dto.newPetSpecies && dto.newPetSpecies.trim()) || 'Khác',
          owner: { id: dto.userId } as any,
          isActive: true,
        });
        const savedPet = await this.petRepository.save(newPet);
        base.petId = savedPet.id;
      }
    } else {
      // Khách vãng lai: lưu thông tin liên hệ để làm hồ sơ và kết nối sau này
      base.customerType = 'guest';
      base.userId = undefined;
      base.guestName = dto.guestName;
      base.guestPhone = this.normalizePhone(dto.guestPhone) || dto.guestPhone;
      base.guestEmail = dto.guestEmail;
      base.guestPetName = dto.guestPetName;
      base.guestPetSpecies = dto.guestPetSpecies;
    }

    // Kiểm tra trùng khung giờ của nhân viên phụ trách trước khi lưu
    await this.assertNoStaffConflict(
      staffId,
      appointmentDate,
      base.duration ?? 30,
    );

    const appointment = this.appointmentRepository.create(base);
    const saved = await this.appointmentRepository.save(appointment);
    return this.findOne(saved.id);
  }

  /**
   * Khi khách vãng lai đăng ký tài khoản, kết nối các lịch hẹn (và lịch sử khám)
   * đã lưu theo số điện thoại với tài khoản mới.
   * Trả về số lịch hẹn được kết nối.
   */
  async linkGuestAppointmentsByPhone(phone: string, userId: string): Promise<number> {
    const normalized = this.normalizePhone(phone);
    if (!normalized) return 0;

    const guestAppointments = await this.appointmentRepository.find({
      where: { customerType: 'guest', userId: IsNull() },
    });

    const matched = guestAppointments.filter(
      (a) => this.normalizePhone(a.guestPhone) === normalized,
    );

    for (const appt of matched) {
      appt.userId = userId;
      appt.customerType = 'registered';
      // Giữ nguyên thông tin guest để truy vết, nhưng gắn về tài khoản
      appt.isArchived = false;
    }

    if (matched.length > 0) {
      await this.appointmentRepository.save(matched);
    }
    return matched.length;
  }

  /** Danh sách nhân viên (và admin) để phân công phụ trách. */
  async getStaffMembers() {
    const staff = await this.userRepository.find({
      where: [{ role: UserRole.STAFF }, { role: UserRole.ADMIN }],
      relations: ['profile'],
      order: { createdAt: 'ASC' },
    });
    return staff.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      name: u.profile?.name || u.email,
    }));
  }

  /** Tìm kiếm khách hàng đã có tài khoản theo tên / email / số điện thoại. */
  async searchCustomers(q: string) {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.pets', 'pets')
      .where('user.role = :role', { role: UserRole.USER });

    if (q && q.trim()) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('profile.name LIKE :q', { q: `%${q}%` })
            .orWhere('user.email LIKE :q', { q: `%${q}%` })
            .orWhere('profile.phone LIKE :q', { q: `%${q}%` });
        }),
      );
    }

    const users = await qb.orderBy('user.createdAt', 'DESC').take(20).getMany();
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.profile?.name || u.email,
      phone: u.profile?.phone || null,
      pets: (u.pets || []).map((p) => ({ id: p.id, name: p.name, species: p.species })),
    }));
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: string,
    date?: string,
    search?: string,
    userId?: string,
    staffId?: string,
  ) {
    // Convert to numbers in case they come as strings from query parameters
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const queryBuilder = this.appointmentRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('appointment.pet', 'pet')
      .leftJoinAndSelect('appointment.staff', 'staff')
      .leftJoinAndSelect('staff.profile', 'staffProfile')
      .orderBy('appointment.createdAt', 'DESC');

    // BAT BUOC filter theo userId neu duoc truyen vao (user thuong chi xem cua minh).
    // Day la fix cho lo hong cu, nguoi dung thuong nhin thay lich hen cua user khac.
    if (userId) {
      queryBuilder.andWhere('appointment.userId = :userId', { userId });
    }

    // Nhân viên chỉ xem các lịch hẹn được phân công cho mình
    if (staffId) {
      queryBuilder.andWhere('appointment.staffId = :staffId', { staffId });
    }

    // Filter by status
    if (status && status !== 'all') {
      queryBuilder.andWhere('appointment.status = :status', { status });
    }

    // Filter by date
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('appointment.appointmentDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // Search by customer name, pet name, or service name
    if (search) {
      queryBuilder.andWhere(
        `(profile.name LIKE :search
          OR user.email LIKE :search
          OR pet.name LIKE :search
          OR service.name LIKE :search
          OR appointment.guestName LIKE :search
          OR appointment.guestPhone LIKE :search
          OR appointment.guestEmail LIKE :search
          OR appointment.guestPetName LIKE :search)`,
        { search: `%${search}%` }
      );
    }

    queryBuilder.skip((pageNum - 1) * limitNum).take(limitNum);

    const [appointments, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limitNum);

    return {
      data: appointments,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    };
  }

  async findOne(id: string, requesterUserId?: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['user', 'user.profile', 'service', 'pet', 'staff', 'staff.profile'],
    });

    if (!appointment) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }

    // Nguoi dung thuong chi duoc xem lich hen cua minh.
    // Admin/Staff goi findOne(id) khong truyen requesterUserId -> bo qua check.
    if (requesterUserId && appointment.userId !== requesterUserId) {
      throw new ForbiddenException('Bạn không có quyền xem lịch hẹn này');
    }

    return appointment;
  }

  async update(id: string, updateAppointmentDto: any) {
    const appointment = await this.findOne(id);

    const patch: any = { ...updateAppointmentDto };
    // Đồng bộ ngày giờ vào cả 2 cột dateTime và appointmentDate
    if (updateAppointmentDto.appointmentDate) {
      const d = new Date(updateAppointmentDto.appointmentDate);
      patch.appointmentDate = d;
      patch.dateTime = d;
    }

    // Kiểm tra trùng khung giờ của nhân viên (trừ khi lịch bị huỷ/hoàn thành/vắng)
    const effStatus = updateAppointmentDto.status ?? appointment.status;
    const skip = [
      AppointmentStatus.CANCELLED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.NO_SHOW,
    ].includes(effStatus);

    const effStaffId =
      updateAppointmentDto.staffId !== undefined
        ? updateAppointmentDto.staffId
        : appointment.staffId;
    const effStart = patch.appointmentDate
      ? patch.appointmentDate
      : new Date(appointment.dateTime || appointment.appointmentDate);
    const effDuration =
      updateAppointmentDto.duration ?? appointment.duration ?? 30;

    // Chỉ kiểm tra trùng khi thực sự ĐỔI nhân viên hoặc ĐỔI khung giờ,
    // tránh chặn nhầm khi chỉ sửa trạng thái/ghi chú của lịch hiện có.
    const oldStart = new Date(
      appointment.dateTime || appointment.appointmentDate,
    ).getTime();
    const staffChanged = effStaffId !== appointment.staffId;
    const timeChanged = effStart.getTime() !== oldStart;

    if (!skip && (staffChanged || timeChanged)) {
      await this.assertNoStaffConflict(effStaffId, effStart, effDuration, id);
    }

    await this.appointmentRepository.update(id, patch);
    return this.findOne(id);
  }

  async remove(id: string) {
    const appointment = await this.findOne(id);
    return this.appointmentRepository.delete(id);
  }

  async cancelByUser(id: string, userId: string, cancellationReason?: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!appointment) {
      throw new NotFoundException('Lịch hẹn không tồn tại');
    }

    // Check if user owns this appointment
    if (appointment.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền hủy lịch hẹn này');
    }

    // Check if appointment can be cancelled
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      throw new ForbiddenException('Không thể hủy lịch hẹn ở trạng thái này');
    }

    // Update appointment
    appointment.status = AppointmentStatus.CANCELLED;
    if (cancellationReason) {
      appointment.notes = appointment.notes
        ? `${appointment.notes}\n\nLý do hủy: ${cancellationReason}`
        : `Lý do hủy: ${cancellationReason}`;
    }

    await this.appointmentRepository.save(appointment);

    return {
      success: true,
      message: 'Đã hủy lịch hẹn thành công',
      appointment,
    };
  }
}