import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Khám sức khỏe tổng quát',
    description: 'Service name',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'Khám sức khỏe tổng quát cho thú cưng bao gồm...',
    description: 'Service description',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 200000,
    description: 'Service price in VND',
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    example: 60,
    description: 'Service duration in minutes',
  })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({
    example: ['dog', 'cat'],
    description: 'Compatible pet types',
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  petTypes: string[];

  @ApiProperty({
    example: 'uuid-category-id',
    description: 'Category ID',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    example: 'https://example.com/service-image.jpg',
    description: 'Service image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    example: ['feature1', 'feature2'],
    description: 'Service features',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({
    example: ['requirement1', 'requirement2'],
    description: 'Service requirements',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiProperty({
    example: 'Preparation instructions...',
    description: 'Preparation instructions',
    required: false,
  })
  @IsOptional()
  @IsString()
  preparation?: string;

  @ApiProperty({
    example: 'Aftercare instructions...',
    description: 'Aftercare instructions',
    required: false,
  })
  @IsOptional()
  @IsString()
  aftercare?: string;

  @ApiProperty({
    example: true,
    description: 'Whether service is bookable',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;

  @ApiProperty({
    example: 0,
    description: 'Sort order',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}