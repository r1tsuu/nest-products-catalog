import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '@/users/user.entity';
import { Product } from '@/products/product.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'boolean', default: false })
  isProcessed: boolean;

  @Column({ type: 'boolean', default: false })
  isCanceled: boolean;

  @ManyToMany(() => Product)
  @JoinTable()
  products: Product[];

  @ManyToOne(() => User, (user) => user.orders)
  user: User;
}
