import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSupportTicketDto {
  @ApiProperty({
    example: 'in_progress',
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['open', 'in_progress', 'resolved', 'closed'])
  status?: string;

  @ApiProperty({
    example: 'high',
    enum: ['low', 'medium', 'high', 'urgent'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @ApiProperty({
    example: 'uuid-staff-id',
    description: 'Staff member to assign ticket to',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiProperty({
    example: 'Đã cập nhật mật khẩu và gửi link reset cho khách hàng',
    description: 'Resolution details',
    required: false,
  })
  @IsOptional()
  @IsString()
  resolution?: string;
}