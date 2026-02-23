import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Pet } from '../../pets/entities/pet.entity';
import { ConsultationMessage } from './consultation-message.entity';

@Entity('consultations')
export class Consultation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ['online', 'offline', 'emergency'],
    default: 'online',
  })
  type: string;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled',
  })
  status: string;

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  endedAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fee: number;

  @Column('uuid')
  userId: string;

  @Column('uuid', { nullable: true })
  vetId: string;

  @Column('uuid', { nullable: true })
  petId: string;

  @Column('text', { nullable: true })
  diagnosis: string;

  @Column('text', { nullable: true })
  prescription: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column('simple-array', { nullable: true })
  attachments: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.consultations)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'vetId' })
  vet: User;

  @ManyToOne(() => Pet, { nullable: true })
  @JoinColumn({ name: 'petId' })
  pet: Pet;

  @OneToMany(() => ConsultationMessage, message => message.consultation)
  messages: ConsultationMessage[];
}