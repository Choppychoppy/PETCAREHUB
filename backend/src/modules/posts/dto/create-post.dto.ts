import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PostType } from '../entities/post.entity';

export class CreatePostDto {
  @ApiProperty({ description: 'Post title' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Post tags', required: false })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: 'Post content' })
  @IsString()
  content: string;

  @ApiProperty({ 
    description: 'Post type', 
    enum: PostType, 
    default: PostType.USER_POST,
    required: false 
  })
  @IsOptional()
  type?: string;

  @ApiProperty({ 
    description: 'Post status', 
    enum: ['draft', 'published', 'archived'], 
    default: 'published',
    required: false 
  })
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Is featured post', required: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({ description: 'Is pinned post', required: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiProperty({ description: 'Post images', required: false })
  @IsOptional()
  images?: string[];

  @ApiProperty({ description: 'SEO meta data', required: false })
  @IsOptional()
  @IsObject()
  seoMeta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  @ApiProperty({ description: 'Category ID', required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ description: 'Author ID', required: false })
  @IsOptional()
  @IsString()
  authorId?: string;
}