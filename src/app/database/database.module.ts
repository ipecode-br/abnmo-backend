import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { testTypeOrmConfig } from '@/config/typeorm.config';
import { DATABASE_ENTITIES } from '@/domain/entities/database';
import { EnvModule } from '@/env/env.module';
import { EnvService } from '@/env/env.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (env: EnvService) => {
        // Use test configuration if NODE_ENV is test
        if (process.env.NODE_ENV === 'test') {
          return testTypeOrmConfig();
        }

        // Use regular configuration for development/production
        return {
          type: 'mysql',
          host: env.get('DB_HOST'),
          port: env.get('DB_PORT'),
          database: env.get('DB_DATABASE'),
          username: env.get('DB_USERNAME'),
          password: env.get('DB_PASSWORD'),
          entities: DATABASE_ENTITIES,
          migrations: [__dirname + 'infra/database/migrations/**/*.ts'],
          synchronize: false,
          extra: {
            connectionLimit: 10,
            connectTimeout: 10000,
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
