import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FilterPostDto {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    description: 'Post type filter', 
    enum: ['blog', 'user_post', 'question'], 
    required: false 
  })
  @IsOptional()
  type?: string;

  @ApiProperty({ 
    description: 'Post status filter', 
    enum: ['draft', 'published', 'archived'], 
    required: false 
  })
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Category ID filter', required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ description: 'Author ID filter', required: false })
  @IsOptional()
  @IsString()
  authorId?: string;

  @ApiProperty({ description: 'Tag filter', required: false })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({ description: 'Featured posts filter', required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  featured?: boolean;

  @ApiProperty({ 
    description: 'Sort field', 
    required: false, 
    default: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'title', 'views']
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'views';

  @ApiProperty({ 
    description: 'Sort order', 
    required: false, 
    default: 'DESC',
    enum: ['ASC', 'DESC']
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}