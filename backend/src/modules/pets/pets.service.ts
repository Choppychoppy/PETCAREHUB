import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from './entities/pet.entity';
import { PetMedicalHistory } from './entities/pet-medical-history.entity';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
    @InjectRepository(PetMedicalHistory)
    private medicalHistoryRepository: Repository<PetMedicalHistory>,
  ) {}

  async create(userId: string, createPetDto: CreatePetDto): Promise<Pet> {
    const pet = this.petRepository.create({
      ...createPetDto,
      owner: { id: userId },
    });

    return this.petRepository.save(pet);
  }

  async findAllByUser(userId: string): Promise<Pet[]> {
    return this.petRepository.find({
      where: { owner: { id: userId }, isActive: true },
      relations: ['medicalHistory'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Pet> {
    const pet = await this.petRepository.findOne({
      where: { id, isActive: true },
      relations: ['owner', 'medicalHistory', 'appointments'],
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    // Check if user owns this pet
    if (pet.owner.id !== userId) {
      throw new ForbiddenException('You can only access your own pets');
    }

    return pet;
  }

  async update(id: string, userId: string, updatePetDto: UpdatePetDto): Promise<Pet> {
    const pet = await this.findOne(id, userId);
    
    Object.assign(pet, updatePetDto);
    return this.petRepository.save(pet);
  }

  async remove(id: string, userId: string): Promise<void> {
    const pet = await this.findOne(id, userId);
    pet.isActive = false;
    await this.petRepository.save(pet);
  }

  // Medical History Methods
  async addMedicalRecord(
    petId: string,
    userId: string,
    createMedicalRecordDto: CreateMedicalRecordDto,
  ): Promise<PetMedicalHistory> {
    const pet = await this.findOne(petId, userId);

    const medicalRecord = this.medicalHistoryRepository.create({
      ...createMedicalRecordDto,
      pet,
    });

    return this.medicalHistoryRepository.save(medicalRecord);
  }

  async getMedicalHistory(petId: string, userId: string): Promise<PetMedicalHistory[]> {
    const pet = await this.findOne(petId, userId);

    return this.medicalHistoryRepository.find({
      where: { pet: { id: pet.id } },
      order: { date: 'DESC' },
    });
  }

  async updateMedicalRecord(
    recordId: string,
    petId: string,
    userId: string,
    updateData: Partial<CreateMedicalRecordDto>,
  ): Promise<PetMedicalHistory> {
    // First verify pet ownership
    await this.findOne(petId, userId);

    const record = await this.medicalHistoryRepository.findOne({
      where: { id: recordId, pet: { id: petId } },
    });

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    Object.assign(record, updateData);
    return this.medicalHistoryRepository.save(record);
  }

  async deleteMedicalRecord(recordId: string, petId: string, userId: string): Promise<void> {
    // First verify pet ownership
    await this.findOne(petId, userId);

    const record = await this.medicalHistoryRepository.findOne({
      where: { id: recordId, pet: { id: petId } },
    });

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    await this.medicalHistoryRepository.remove(record);
  }

  // Admin methods
  async findAllForAdmin(page: number = 1, limit: number = 10) {
    const [pets, total] = await this.petRepository.findAndCount({
      relations: ['owner', 'owner.profile'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: pets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStatistics() {
    const totalPets = await this.petRepository.count({ where: { isActive: true } });
    const speciesStats = await this.petRepository
      .createQueryBuilder('pet')
      .select('pet.species', 'species')
      .addSelect('COUNT(*)', 'count')
      .where('pet.isActive = true')
      .groupBy('pet.species')
      .getRawMany();

    return {
      totalPets,
      speciesStats,
    };
  }
}