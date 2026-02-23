import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';
import { Pet } from './entities/pet.entity';
import { PetMedicalHistory } from './entities/pet-medical-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pet, PetMedicalHistory])],
  controllers: [PetsController],
  providers: [PetsService],
  exports: [PetsService],
})
export class PetsModule {}