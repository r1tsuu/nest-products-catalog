// import {
//   CreateDateColumn,
//   Entity,
//   ManyToMany,
//   ManyToOne,
//   OneToMany,
//   PrimaryGeneratedColumn,
// } from 'typeorm';
// import { Product } from '../products/product.entity';
// import { User } from '../users/user.entity';

// @Entity()
// export class Order {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @CreateDateColumn()
//   created_at: Date;

//   @ManyToMany((type) => Product)
//   products: Product[];

//   @ManyToOne((type) => User, (user) => user.orders)
//   user: User;
// }
