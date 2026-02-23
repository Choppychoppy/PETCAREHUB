import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  businessName: string;

  @Column({ type: 'text', nullable: true })
  businessAddress: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  businessPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  businessEmail: string;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @Column({ type: 'varchar', length: 100, default: 'Asia/Ho_Chi_Minh' })
  timezone: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
