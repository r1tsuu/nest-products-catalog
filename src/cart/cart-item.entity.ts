import { Product } from '@/products/product.entity';
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Cart } from './cart.entity';

@Entity()
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 1, type: 'number' })
  count: number;

  @ManyToOne(() => Product)
  product: Product;

  @ManyToOne(() => Cart)
  cart: Cart;
}
