import {
  AfterInsert,
  AfterLoad,
  AfterUpdate,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

import { Order } from '@/orders/order.entity';

import { Role } from './interfaces/role.enum';
import { Cart } from '@/cart/cart.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  username: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: false })
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    array: true,
    nullable: false,
    default: [Role.User],
  })
  roles: Role[] = [Role.User];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToOne(() => Cart)
  @JoinColumn()
  cart: Cart;

  @AfterLoad()
  @AfterInsert()
  @AfterUpdate()
  nullChecks?() {
    if (!this.orders) {
      this.orders = [];
    }
  }
}
