import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SupportTicket } from './support-ticket.entity';

@Entity('support_messages')
export class SupportMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  message: string;

  @Column('simple-array', { nullable: true })
  attachments: string[];

  @Column({
    type: 'enum',
    enum: ['user', 'staff', 'system'],
    default: 'user',
  })
  type: string;

  @Column('uuid')
  supportTicketId: string;

  @Column('uuid', { nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => SupportTicket, ticket => ticket.messages)
  @JoinColumn({ name: 'supportTicketId' })
  supportTicket: SupportTicket;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}