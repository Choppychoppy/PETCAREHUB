import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FilterPostDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiProperty({
    required: false,
    enum: ['blog', 'user', 'user_post', 'news', 'question'],
  })
  @IsOptional()
  @IsEnum(['blog', 'user', 'user_post', 'news', 'question'])
  type?: string;

  @ApiProperty({
    required: false,
    description:
      'Lọc theo nhiều loại bài viết, ngăn cách bởi dấu phẩy (vd: user,user_post,question)',
  })
  @IsOptional()
  @IsString()
  types?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
  })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  featured?: boolean;
}