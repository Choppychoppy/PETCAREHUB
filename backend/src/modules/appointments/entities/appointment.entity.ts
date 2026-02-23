import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Pet } from '../../pets/entities/pet.entity';
import { Service } from '../../services/entities/service.entity';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'datetime' })
  dateTime: Date;

  @Column({ type: 'datetime' })
  appointmentDate: Date;

  @Column({ type: 'int' })
  duration: number; // in minutes

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  specialRequests: string;

  @Column({ type: 'text', nullable: true })
  staffNotes: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'uuid', nullable: true })
  staffId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedStaff: string; // Staff member ID or name

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  treatment: string;

  @Column({ type: 'text', nullable: true })
  prescription: string;

  @Column({ type: 'datetime', nullable: true })
  followUpDate: Date;

  @Column({ type: 'json', nullable: true })
  beforeImages: string[];

  @Column({ type: 'json', nullable: true })
  afterImages: string[];

  @Column({ type: 'boolean', default: false })
  reminderSent: boolean;

  @Column({ type: 'boolean', default: false })
  followUpSent: boolean;

  // Foreign key columns
  @Column('uuid')
  userId: string;

  @Column('uuid', { nullable: true })
  petId: string;

  @Column('uuid')
  serviceId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.appointments)
  user: User;

  @ManyToOne(() => Pet, (pet) => pet.appointments)
  pet: Pet;

  @ManyToOne(() => Service, (service) => service.appointments)
  service: Service;

  @ManyToOne(() => User, { nullable: true })
  staff: User;
}