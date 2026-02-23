import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConsultationMessageDto {
  @ApiProperty({
    example: 'Con chó đã ăn trở lại bình thường',
    description: 'Message content',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: ['https://example.com/update-photo.jpg'],
    description: 'Message attachments',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiProperty({
    example: 'text',
    enum: ['text', 'image', 'file', 'prescription'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['text', 'image', 'file', 'prescription'])
  messageType?: string;
}