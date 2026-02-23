import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConsultationDto {
  @ApiProperty({
    example: 'active',
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['scheduled', 'active', 'completed', 'cancelled'])
  status?: string;

  @ApiProperty({
    example: 'uuid-vet-id',
    description: 'Assign vet to consultation',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  vetId?: string;

  @ApiProperty({
    example: 'Chó bị viêm dạ dày nhẹ',
    description: 'Diagnosis from vet',
    required: false,
  })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiProperty({
    example: 'Cho uống thuốc kháng sinh 2 lần/ngày trong 7 ngày',
    description: 'Prescription from vet',
    required: false,
  })
  @IsOptional()
  @IsString()
  prescription?: string;

  @ApiProperty({
    example: 'Cần theo dõi thêm 3-5 ngày',
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 100000,
    description: 'Updated consultation fee',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  fee?: number;

  @ApiProperty({
    example: '2024-01-15T10:00:00Z',
    description: 'Rescheduled consultation time',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: Date;
}