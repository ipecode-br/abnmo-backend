import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { testTypeOrmConfig } from '@/config/typeorm.config';
import { EnvModule } from '@/env/env.module';
import { EnvService } from '@/env/env.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (env: EnvService) => {
        if (env.get('NODE_ENV') === 'test') {
          return testTypeOrmConfig();
        }

        // Use regular configuration for all other environments
        return {
          type: 'mysql',
          host: env.get('DB_HOST'),
          port: env.get('DB_PORT'),
          database: env.get('DB_DATABASE'),
          username: env.get('DB_USERNAME'),
          password: env.get('DB_PASSWORD'),
          migrations: [__dirname + 'infra/database/migrations/**/*.ts'],
          namingStrategy: new SnakeNamingStrategy(),
          autoLoadEntities: true,
          synchronize: false,
          retryAttempts: 3,
          retryDelay: 3000,
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
