import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('likes')
@Index(['userId', 'likeableType', 'likeableId'], { unique: true })
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['post', 'comment'] })
  likeableType: string;

  @Column({ type: 'uuid' })
  likeableId: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Note: These relationships are handled programmatically 
  // since we use polymorphic relationships with likeableType and likeableId
}