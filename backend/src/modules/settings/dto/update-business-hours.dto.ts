import { IsArray, IsString, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type, Exclude } from 'class-transformer';

export class BusinessHourDto {
  // These fields should be excluded from input validation (they come from database)
  @Exclude()
  @IsOptional()
  id?: string;

  @Exclude()
  @IsOptional()
  createdAt?: Date;

  @Exclude()
  @IsOptional()
  updatedAt?: Date;

  @IsString()
  day: string;

  @IsOptional()
  @IsString()
  openTime?: string;

  @IsOptional()
  @IsString()
  closeTime?: string;

  @IsBoolean()
  isClosed: boolean;
}

export class UpdateBusinessHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessHourDto)
  hours: BusinessHourDto[];
}
