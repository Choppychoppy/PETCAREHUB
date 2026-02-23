import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'varchar', length: 255 })
  productName: string; // Snapshot of product name at order time

  @Column({ type: 'varchar', length: 100 })
  productSku: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  variantName: string;

  @Column({ type: 'json', nullable: true })
  variantAttributes: Record<string, any>;

  @Column({ type: 'varchar', length: 500, nullable: true })
  productImage: string;

  // Relations
  @ManyToOne(() => Order, (order) => order.items)
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderItems)
  product: Product;

  @ManyToOne(() => ProductVariant, { nullable: true })
  variant: ProductVariant;
}