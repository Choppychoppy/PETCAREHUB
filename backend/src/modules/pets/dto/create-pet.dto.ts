import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePetDto {
  @ApiProperty({
    example: 'Buddy',
    description: 'Pet name',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'Dog',
    description: 'Pet species',
  })
  @IsString()
  @MaxLength(50)
  species: string;

  @ApiProperty({
    example: 'Golden Retriever',
    description: 'Pet breed',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  breed?: string;

  @ApiProperty({
    example: 3,
    description: 'Pet age in years',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  age?: number;

  @ApiProperty({
    example: 25.5,
    description: 'Pet weight in kg',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiProperty({
    example: 'male',
    description: 'Pet gender',
    enum: ['male', 'female'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['male', 'female'])
  gender?: string;

  @ApiProperty({
    example: 'https://example.com/pet-photo.jpg',
    description: 'Pet photo URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiProperty({
    example: 'Friendly and energetic dog',
    description: 'Medical notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  medicalNotes?: string;

  @ApiProperty({
    example: 'Very social, loves playing with other dogs',
    description: 'Behavior notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  behaviorNotes?: string;

  @ApiProperty({
    example: ['peanuts', 'chocolate'],
    description: 'Known allergies',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiProperty({
    example: '2020-01-15',
    description: 'Date of birth',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    example: 'ABC123456789',
    description: 'Microchip number',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  microchipNumber?: string;
}