import {
  IsString,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupportMessageDto {
  @ApiProperty({
    example: 'Tôi đã thử làm theo hướng dẫn nhưng vẫn không được',
    description: 'Message content',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: ['https://example.com/screenshot.png'],
    description: 'Message attachments',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}