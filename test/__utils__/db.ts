import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from '@/models/user.entity';
import { Product } from '@/models/product.entity';
import { Order } from '@/models/order.entity';

export const dbModule = (database: string) =>
  TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: (config: ConfigService) => ({
      type: 'postgres',
      synchronize: true,
      url: config.get('PREFIX_DB_URL_TEST') + `${database}`,
      entities: [User, Product, Order],
    }),
    inject: [ConfigService],
  });
