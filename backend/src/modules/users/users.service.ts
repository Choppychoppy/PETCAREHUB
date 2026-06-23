import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRole, UserStatus } from '../../common/enums/user-role.enum';

export interface FindAllUsersParams {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['profile'],
    });
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);

    // Update user profile
    if (user.profile) {
      Object.assign(user.profile, updateProfileDto);
      await this.userProfileRepository.save(user.profile);
    } else {
      // Create new profile if doesn't exist
      const profile = this.userProfileRepository.create({
        ...updateProfileDto,
        user,
      });
      await this.userProfileRepository.save(profile);
    }

    return this.findById(userId);
  }

  async findAll(params: FindAllUsersParams = {}) {
    const { page = 1, limit = 10, role, status, search } = params;

    // Convert to numbers in case they come as strings from query parameters
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile');

    // Filter by role
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    // Filter by status
    if (status && Object.values(UserStatus).includes(status as UserStatus)) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    // Search by email or profile name
    if (search) {
      queryBuilder.andWhere(
        '(user.email LIKE :search OR profile.firstName LIKE :search OR profile.lastName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [users, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limitNum);

    return {
      data: users,
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

  async updateUser(userId: string, updateData: { role?: UserRole; status?: UserStatus; profile?: Partial<UpdateProfileDto> }): Promise<User> {
    const user = await this.findById(userId);

    // Update role if provided
    if (updateData.role && Object.values(UserRole).includes(updateData.role)) {
      user.role = updateData.role;
    }

    // Update status if provided
    if (updateData.status && Object.values(UserStatus).includes(updateData.status)) {
      user.status = updateData.status;
    }

    await this.userRepository.save(user);

    // Update profile if provided
    if (updateData.profile) {
      if (user.profile) {
        Object.assign(user.profile, updateData.profile);
        await this.userProfileRepository.save(user.profile);
      } else {
        const profile = this.userProfileRepository.create({
          ...updateData.profile,
          user,
        });
        await this.userProfileRepository.save(profile);
      }
    }

    return this.findById(userId);
  }

  async banUser(userId: string, reason?: string): Promise<User> {
    const user = await this.findById(userId);

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Không thể cấm tài khoản quản trị viên');
    }

    user.status = UserStatus.BANNED;
    await this.userRepository.save(user);

    return this.findById(userId);
  }

  async unbanUser(userId: string): Promise<User> {
    const user = await this.findById(userId);

    if (user.status !== UserStatus.BANNED) {
      throw new BadRequestException('Tài khoản này hiện không bị cấm');
    }

    user.status = UserStatus.ACTIVE;
    await this.userRepository.save(user);

    return this.findById(userId);
  }
}