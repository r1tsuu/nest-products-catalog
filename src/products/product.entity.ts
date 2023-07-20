import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ColumnNumericTransformer } from '@/shared/transformers/column-numeric.transformer';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  photo: string;

  @Column({
    type: 'bigint',
    nullable: false,
    transformer: ColumnNumericTransformer,
  })
  price: number;

  @Column({ type: 'text', nullable: false })
  slug: string;
}
