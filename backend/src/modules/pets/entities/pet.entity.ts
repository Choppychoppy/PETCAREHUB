import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PetMedicalHistory } from './pet-medical-history.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  species: string; // Dog, Cat, Bird, Fish, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  breed: string;

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'enum', enum: ['male', 'female'], nullable: true })
  gender: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photoUrl: string;

  @Column({ type: 'text', nullable: true })
  medicalNotes: string;

  @Column({ type: 'text', nullable: true })
  behaviorNotes: string;

  @Column({ type: 'json', nullable: true })
  allergies: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  microchipNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.pets)
  owner: User;

  @OneToMany(() => PetMedicalHistory, (history) => history.pet)
  medicalHistory: PetMedicalHistory[];

  @OneToMany(() => Appointment, (appointment) => appointment.pet)
  appointments: Appointment[];
}