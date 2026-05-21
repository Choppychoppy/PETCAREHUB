import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  async create(userId: string, createAppointmentDto: any) {
    const appointment = this.appointmentRepository.create({
      ...createAppointmentDto,
      userId,
    });
    return this.appointmentRepository.save(appointment);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: string,
    date?: string,
    search?: string,
    userId?: string,
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
          OR service.name LIKE :search)`,
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
      throw new NotFoundException('Appointment not found');
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
    await this.appointmentRepository.update(id, updateAppointmentDto);
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