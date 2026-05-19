import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { DATABASE_ENTITIES } from '@/domain/entities/database';
import { EnvService } from '@/env/env.service';

export function getTypeOrmConfig(env: EnvService): TypeOrmModuleOptions {
  const isTestEnv = env.get('NODE_ENV') === 'test';

  const baseConfig: TypeOrmModuleOptions = {
    type: 'mysql',
    host: env.get('DB_HOST'),
    port: env.get('DB_PORT'),
    database: env.get('DB_DATABASE'),
    username: env.get('DB_USERNAME'),
    password: env.get('DB_PASSWORD'),
    migrations: [__dirname + '/infra/database/migrations/**/*.ts'],
    namingStrategy: new SnakeNamingStrategy(),
    entities: DATABASE_ENTITIES,
    synchronize: false,
    migrationsRun: false,
    logging: false,
    dropSchema: false,
    ssl: false,
    retryAttempts: 1,
    retryDelay: 500,
    extra: {
      connectionLimit: 2,
      connectTimeout: 2000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    },
  };

  if (isTestEnv) {
    return {
      ...baseConfig,
      cache: false,
      extra: {
        ...baseConfig.extra,
        acquireTimeout: 2000,
        charset: 'utf8mb4_unicode_ci',
        ssl: false,
        timeout: 2000,
      },
    };
  }

  return baseConfig;
}
