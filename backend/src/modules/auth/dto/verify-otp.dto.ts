import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email đã dùng để đăng ký',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Mã OTP 6 chữ số được gửi qua email',
  })
  @IsString()
  @Length(6, 6, { message: 'Mã OTP phải gồm 6 chữ số' })
  otp: string;
}
