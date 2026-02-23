import {
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupportTicketDto {
  @ApiProperty({
    example: 'Không thể đăng nhập vào tài khoản',
    description: 'Ticket title',
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'Tôi đã thử nhiều lần nhưng không thể đăng nhập...',
    description: 'Detailed description of the issue',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 'medium',
    enum: ['low', 'medium', 'high', 'urgent'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @ApiProperty({
    example: 'technical',
    enum: ['technical', 'billing', 'general', 'complaint'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['technical', 'billing', 'general', 'complaint'])
  category?: string;
}