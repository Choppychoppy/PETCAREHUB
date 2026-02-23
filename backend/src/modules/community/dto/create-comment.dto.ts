import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Bài viết rất hay và bổ ích!',
    description: 'Comment content',
  })
  @IsString()
  content: string;

  @ApiProperty({
    example: 'uuid-parent-comment-id',
    description: 'Parent comment ID for replies',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}