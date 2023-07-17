import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const dbModule = (database: string, ...entities: any[]) =>
  TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: (config: ConfigService) => ({
      type: 'postgres',
      synchronize: true,
      url: config.get('PREFIX_DB_URL_TEST') + `${database}`,
      entities,
    }),
    inject: [ConfigService],
  });
