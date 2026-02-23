import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: ['order', 'appointment', 'consultation', 'promotion', 'system', 'support'],
    default: 'system',
  })
  type: string;

  @Column({ default: false })
  isRead: boolean;

  @Column('uuid')
  userId: string;

  @Column('uuid', { nullable: true })
  relatedId: string;

  @Column({ nullable: true })
  relatedType: string;

  @Column('json', { nullable: true })
  data: any;

  @Column({ nullable: true })
  actionUrl: string;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  })
  priority: string;

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ default: false })
  emailSent: boolean;

  @Column({ default: false })
  smsSent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}