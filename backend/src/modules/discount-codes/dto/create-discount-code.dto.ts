import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsArray, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DiscountType, DiscountStatus } from '../entities/discount-code.entity';

export class CreateDiscountCodeDto {
  @ApiProperty({ description: 'Discount code', example: 'SUMMER2025' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Discount name', example: 'Summer Sale 2025' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Discount type', enum: DiscountType })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({ description: 'Discount value', example: 20 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ description: 'Minimum order amount', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiProperty({ description: 'Maximum discount amount', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @ApiProperty({ description: 'Usage limit', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @ApiProperty({ description: 'Valid from date' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ description: 'Valid to date' })
  @IsDateString()
  validTo: string;

  @ApiProperty({ description: 'Status', enum: DiscountStatus, required: false })
  @IsOptional()
  @IsEnum(DiscountStatus)
  status?: DiscountStatus;

  @ApiProperty({ description: 'Applicable product IDs', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableProducts?: string[];

  @ApiProperty({ description: 'Applicable category IDs', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableCategories?: string[];
}