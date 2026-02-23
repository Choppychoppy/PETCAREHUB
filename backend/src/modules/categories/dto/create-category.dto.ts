import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Thức ăn cho chó',
    description: 'Category name',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'service',
    description: 'Category type',
    enum: ['service', 'product', 'pet', 'content'],
  })
  @IsEnum(['service', 'product', 'pet', 'content'])
  type: string;

  @ApiProperty({
    example: 'Các loại thức ăn dinh dưỡng cho chó',
    description: 'Category description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'fas fa-dog',
    description: 'Category icon',
    required: false,
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    example: 'https://example.com/category-image.jpg',
    description: 'Category image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    example: 'uuid-parent-category-id',
    description: 'Parent category ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({
    example: 0,
    description: 'Sort order',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({
    example: {
      title: 'Premium Dog Food',
      description: 'Best nutrition for your dog',
      keywords: ['dog food', 'nutrition', 'premium'],
    },
    description: 'SEO metadata',
    required: false,
  })
  @IsOptional()
  @IsObject()
  seoMeta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}