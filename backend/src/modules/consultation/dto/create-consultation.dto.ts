import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
  IsArray,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConsultationDto {
  @ApiProperty({
    example: 'Tư vấn về tình trạng sức khỏe của chó',
    description: 'Consultation title',
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'Con chó nhà tôi gần đây hay bỏ ăn và uể oải...',
    description: 'Detailed description of the consultation request',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 'online',
    enum: ['online', 'offline', 'emergency'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['online', 'offline', 'emergency'])
  type?: string;

  @ApiProperty({
    example: '2024-01-15T09:00:00Z',
    description: 'Preferred consultation time',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: Date;

  @ApiProperty({
    example: 'uuid-pet-id',
    description: 'Pet ID for consultation',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  petId?: string;

  @ApiProperty({
    example: ['https://example.com/pet-photo.jpg'],
    description: 'Initial attachments for consultation',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiProperty({
    example: 50000,
    description: 'Consultation fee',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  fee?: number;
}