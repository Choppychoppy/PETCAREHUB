import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ProductImageDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateProductDto {
  @ApiProperty({
    example: 'Royal Canin Adult Dog Food',
    description: 'Product name',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'Premium adult dog food for daily nutrition...',
    description: 'Product description',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 'Premium adult dog food',
    description: 'Short description',
    required: false,
  })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({
    example: 299000,
    description: 'Product price in VND',
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    example: 350000,
    description: 'Compare at price (original price)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @ApiProperty({
    example: 100,
    description: 'Stock quantity',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiProperty({
    example: 10,
    description: 'Low stock threshold',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  lowStockThreshold?: number;

  @ApiProperty({
    example: 2.5,
    description: 'Product weight in kg',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({
    example: 'Royal Canin',
    description: 'Product brand',
    required: false,
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({
    example: ['premium', 'adult', 'nutrition'],
    description: 'Product tags',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    example: 'uuid-category-id',
    description: 'Category ID',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    example: false,
    description: 'Is digital product',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isDigital?: boolean;

  @ApiProperty({
    example: true,
    description: 'Requires shipping',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresShipping?: boolean;

  @ApiProperty({
    type: [ProductImageDto],
    description: 'Product images',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @ApiProperty({
    example: { color: 'red', size: 'medium' },
    description: 'Product specifications',
    required: false,
  })
  @IsOptional()
  specifications?: Record<string, any>;
}