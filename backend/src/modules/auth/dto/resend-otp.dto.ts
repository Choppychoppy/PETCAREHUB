import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendOtpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email cần gửi lại mã OTP',
  })
  @IsEmail()
  email: string;
}
