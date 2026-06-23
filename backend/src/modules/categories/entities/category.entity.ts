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
import { Service } from '../../services/entities/service.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ 
    type: 'enum', 
    enum: ['service', 'product', 'pet', 'content'], 
    default: 'service' 
  })
  type: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string;

  @Column({ type: 'json', nullable: true })
  seoMeta: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Self-referencing for hierarchical categories
  // Map tường minh cột parentId để có thể tạo/cập nhật danh mục con bằng parentId
  @Column({ type: 'varchar', length: 36, nullable: true })
  parentId: string | null;

  @ManyToOne(() => Category, (category) => category.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  // Relations
  @OneToMany(() => Service, (service) => service.category)
  services: Service[];

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}