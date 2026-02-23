import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsObject,
  IsUrl,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({
    example: 'Đơn hàng của bạn đã được xác nhận',
    description: 'Notification title',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Đơn hàng #12345 đã được xác nhận và sẽ được giao trong 2-3 ngày',
    description: 'Notification message',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: 'order',
    enum: ['order', 'appointment', 'consultation', 'promotion', 'system', 'support'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['order', 'appointment', 'consultation', 'promotion', 'system', 'support'])
  type?: string;

  @ApiProperty({
    example: 'uuid-user-id',
    description: 'Target user ID',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    example: 'uuid-order-id',
    description: 'Related entity ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  relatedId?: string;

  @ApiProperty({
    example: 'Order',
    description: 'Related entity type',
    required: false,
  })
  @IsOptional()
  @IsString()
  relatedType?: string;

  @ApiProperty({
    example: { orderId: 'uuid', total: 250000 },
    description: 'Additional notification data',
    required: false,
  })
  @IsOptional()
  @IsObject()
  data?: any;

  @ApiProperty({
    example: '/orders/uuid-order-id',
    description: 'Action URL for notification',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  actionUrl?: string;

  @ApiProperty({
    example: 'medium',
    enum: ['low', 'medium', 'high'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: string;

  @ApiProperty({
    example: '2024-01-15T10:00:00Z',
    description: 'Schedule notification for later',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: Date;
}