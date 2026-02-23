import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotificationDto {
  @ApiProperty({
    example: true,
    description: 'Mark notification as read',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}