import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { UserRole, UserStatus } from '../../common/enums/user-role.enum';
import { EmailService } from '../../common/services/email.service';
import { AppointmentsService } from '../appointments/appointments.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

// Thời gian hết hạn mã OTP: 15 phút
const OTP_EXPIRY_MINUTES = 15;

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private appointmentsService: AppointmentsService,
  ) {}

  // Sinh mã OTP 6 chữ số
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getOtpExpiry(): Date {
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + OTP_EXPIRY_MINUTES);
    return expires;
  }

  async register(registerDto: RegisterDto): Promise<{ message: string; email: string }> {
    const { email, password, name, phone } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Sinh mã OTP và thời gian hết hạn
    const otp = this.generateOtp();

    // Create user (chưa xác minh email)
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      emailVerificationToken: otp,
      emailVerificationExpires: this.getOtpExpiry(),
    });

    const savedUser = await this.userRepository.save(user);

    // Create user profile
    const profile = this.userProfileRepository.create({
      name,
      phone: phone || null,
      user: savedUser,
    });

    await this.userProfileRepository.save(profile);

    // Kết nối các lịch hẹn của khách vãng lai (đã được nhân viên tạo trước đó)
    // với tài khoản mới dựa theo số điện thoại. Bao gồm cả lịch sử khám chữa.
    if (phone) {
      try {
        const linked = await this.appointmentsService.linkGuestAppointmentsByPhone(
          phone,
          savedUser.id,
        );
        if (linked > 0) {
          console.log(`Đã kết nối ${linked} lịch hẹn vãng lai cho tài khoản ${email}`);
        }
      } catch (error) {
        console.error('Kết nối lịch hẹn vãng lai thất bại:', error);
      }
    }

    // Gửi email chứa mã OTP. Không để lỗi SMTP làm hỏng việc đăng ký:
    // tài khoản vẫn được tạo và người dùng có thể bấm "Gửi lại mã".
    try {
      await this.emailService.sendVerificationOtpEmail(email, name, otp);
    } catch (error) {
      console.error('Gửi email OTP thất bại khi đăng ký:', error);
    }

    // Không trả accessToken: người dùng phải xác minh OTP trước
    return {
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác minh.',
      email,
    };
  }

  async verifyOtp(email: string, otp: string): Promise<{ user: User; accessToken: string }> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['profile'],
    });

    if (!user) {
      throw new BadRequestException('Không tìm thấy tài khoản với email này');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Tài khoản đã được xác minh trước đó');
    }

    if (
      !user.emailVerificationToken ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException('Mã xác minh đã hết hạn. Vui lòng yêu cầu gửi lại mã.');
    }

    if (user.emailVerificationToken !== otp) {
      throw new BadRequestException('Mã xác minh không đúng');
    }

    // Xác minh thành công
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Cấp token để tự đăng nhập
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as User,
      accessToken,
    };
  }

  async resendOtp(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['profile'],
    });

    // Không tiết lộ tài khoản có tồn tại hay không
    if (!user || user.emailVerified) {
      return {
        message: 'Nếu email hợp lệ và chưa xác minh, mã xác minh mới đã được gửi.',
      };
    }

    const otp = this.generateOtp();
    user.emailVerificationToken = otp;
    user.emailVerificationExpires = this.getOtpExpiry();
    await this.userRepository.save(user);

    const name = user.profile?.name || 'bạn';
    await this.emailService.sendVerificationOtpEmail(email, name, otp);

    return {
      message: 'Nếu email hợp lệ và chưa xác minh, mã xác minh mới đã được gửi.',
    };
  }

  async login(loginDto: LoginDto): Promise<{ user: User; accessToken: string }> {
    const { email, password } = loginDto;

    // Find user with profile
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['profile'],
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Tài khoản đã bị khóa hoặc chưa được kích hoạt');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // Chặn đăng nhập khi email chưa được xác minh
    if (!user.emailVerified) {
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Tài khoản chưa xác minh email. Vui lòng nhập mã OTP để kích hoạt.',
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as User,
      accessToken,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['profile'],
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result as User;
    }

    return null;
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If user exists, password reset email has been sent' };
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;

    await this.userRepository.save(user);

    // TODO: Send email with reset link
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If user exists, password reset email has been sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: token,
      },
    });

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await this.userRepository.save(user);

    return { message: 'Password has been reset successfully' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    await this.userRepository.save(user);

    return { message: 'Email verified successfully' };
  }
}