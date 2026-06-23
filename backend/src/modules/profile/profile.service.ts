import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
      select: [
        'id',
        'email',
        'role',
        'status',
        'emailVerified',
        'lastLoginAt',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return {
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Update user basic info if provided
    if (updateProfileDto.email) {
      // Check if email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: updateProfileDto.email },
      });
      
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email already exists');
      }
      
      user.email = updateProfileDto.email;
    }

    // Update or create profile
    let profile = user.profile;
    if (!profile) {
      profile = this.userProfileRepository.create({
        user: user,
        name: updateProfileDto.name,
        phone: updateProfileDto.phone,
        address: updateProfileDto.address,
        avatarUrl: updateProfileDto.avatarUrl,
        dateOfBirth: updateProfileDto.dateOfBirth,
        gender: updateProfileDto.gender,
        bio: updateProfileDto.bio,
        city: updateProfileDto.city,
        country: updateProfileDto.country,
        postalCode: updateProfileDto.postalCode,
      });
    } else {
      // Update existing profile
      Object.assign(profile, {
        name: updateProfileDto.name ?? profile.name,
        phone: updateProfileDto.phone ?? profile.phone,
        address: updateProfileDto.address ?? profile.address,
        avatarUrl: updateProfileDto.avatarUrl ?? profile.avatarUrl,
        dateOfBirth: updateProfileDto.dateOfBirth ?? profile.dateOfBirth,
        gender: updateProfileDto.gender ?? profile.gender,
        bio: updateProfileDto.bio ?? profile.bio,
        city: updateProfileDto.city ?? profile.city,
        country: updateProfileDto.country ?? profile.country,
        postalCode: updateProfileDto.postalCode ?? profile.postalCode,
      });
    }

    // Save both user and profile
    await this.userRepository.save(user);
    await this.userProfileRepository.save(profile);

    // Return updated user with profile
    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
      select: [
        'id',
        'email',
        'role',
        'status',
        'emailVerified',
        'lastLoginAt',
        'createdAt',
        'updatedAt',
      ],
    });

    return {
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'password'],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.userRepository.update(userId, {
      password: hashedNewPassword,
    });

    return {
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString(),
    };
  }
}