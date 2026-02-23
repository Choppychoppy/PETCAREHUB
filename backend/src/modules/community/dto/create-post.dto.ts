import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsUUID,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    example: 'Tips chăm sóc chó Golden Retriever',
    description: 'Post title',
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: 'Chia sẻ kinh nghiệm chăm sóc chó Golden Retriever...',
    description: 'Post content',
  })
  @IsString()
  content: string;

  @ApiProperty({
    example: 'user',
    description: 'Post type',
    enum: ['blog', 'user', 'user_post', 'news', 'question'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['blog', 'user', 'user_post', 'news', 'question'])
  type?: string;

  @ApiProperty({
    example: 'uuid-category-id',
    description: 'Category ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    example: ['https://example.com/image1.jpg'],
    description: 'Post images',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    example: ['chó', 'golden-retriever', 'chăm-sóc'],
    description: 'Post tags',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    example: 'published',
    description: 'Post status',
    enum: ['draft', 'published', 'archived'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;

  @ApiProperty({
    example: {
      title: 'SEO title',
      description: 'SEO description',
      keywords: ['keyword1', 'keyword2'],
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