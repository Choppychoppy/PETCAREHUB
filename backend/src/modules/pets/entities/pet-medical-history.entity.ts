import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Pet } from './pet.entity';

@Entity('pet_medical_history')
export class PetMedicalHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  type: string; // vaccination, treatment, checkup, surgery, etc.

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  veterinarian: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  clinic: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number;

  @Column({ type: 'json', nullable: true })
  medications: string[];

  @Column({ type: 'date', nullable: true })
  nextDueDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  attachments: string[]; // URLs to documents/images

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Pet, (pet) => pet.medicalHistory)
  pet: Pet;
}