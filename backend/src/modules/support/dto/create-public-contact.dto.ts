import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePublicContactDto {
  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Guest name',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'email@example.com',
    description: 'Guest email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '0901234567',
    description: 'Guest phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    example: 'Tư vấn dịch vụ grooming',
    description: 'Subject of the message',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  subject: string;

  @ApiProperty({
    example: 'Tôi muốn hỏi về dịch vụ grooming cho chó...',
    description: 'Detailed message',
  })
  @IsString()
  @MinLength(10)
  message: string;

  @ApiProperty({
    example: 'dog',
    description: 'Type of pet',
    required: false,
  })
  @IsOptional()
  @IsString()
  petType?: string;

  @ApiProperty({
    example: 'normal',
    enum: ['low', 'normal', 'high', 'urgent'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'urgent'])
  urgency?: string;
}
