import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Consultation } from './consultation.entity';

@Entity('consultation_messages')
export class ConsultationMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  message: string;

  @Column('simple-array', { nullable: true })
  attachments: string[];

  @Column({
    type: 'enum',
    enum: ['text', 'image', 'file', 'prescription'],
    default: 'text',
  })
  messageType: string;

  @Column('uuid')
  consultationId: string;

  @Column('uuid')
  senderId: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Consultation, consultation => consultation.messages)
  @JoinColumn({ name: 'consultationId' })
  consultation: Consultation;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;
}