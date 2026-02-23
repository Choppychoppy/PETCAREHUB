import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMedicalRecordDto {
  @ApiProperty({
    example: 'vaccination',
    description: 'Type of medical record',
  })
  @IsString()
  @MaxLength(100)
  type: string;

  @ApiProperty({
    example: 'Annual Vaccination',
    description: 'Title of the medical record',
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'Vaccinated against rabies and other diseases',
    description: 'Description of the medical record',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '2023-12-01',
    description: 'Date of the medical event',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 'Dr. Smith',
    description: 'Veterinarian name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  veterinarian?: string;

  @ApiProperty({
    example: 'Pet Care Clinic',
    description: 'Clinic name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clinic?: string;

  @ApiProperty({
    example: 150000,
    description: 'Cost of the treatment in VND',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiProperty({
    example: ['Antibiotics', 'Pain relief'],
    description: 'List of medications',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];

  @ApiProperty({
    example: '2024-12-01',
    description: 'Next due date for follow-up',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @ApiProperty({
    example: 'Pet responded well to treatment',
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: ['https://example.com/xray.jpg'],
    description: 'Attachment URLs',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}