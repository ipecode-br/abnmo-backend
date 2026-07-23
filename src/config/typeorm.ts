import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { DATABASE_ENTITIES } from '@/domain/entities/database';
import { EnvService } from '@/env/env.service';

import { SnakeNamingStrategy } from './snake-naming.strategy';

export function getTypeOrmConfig(env: EnvService): TypeOrmModuleOptions {
  const isLambda = env.get('APP_ENVIRONMENT') === 'lambda';
  const isLocal = env.get('APP_ENVIRONMENT') === 'local';
  const isTestEnv = env.get('NODE_ENV') === 'test';

  const baseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
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
    // Use "ssl: { rejectUnauthorized: false }" when connecting to remote database locally
    ssl: isLocal ? false : { rejectUnauthorized: false },
    retryAttempts: 1,
    retryDelay: 500,
    extra: {
      max: isLambda ? 1 : 20,
      connectionTimeoutMillis: 2000,
      idleTimeoutMillis: 1000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
    },
  };

  if (isTestEnv) {
    return {
      ...baseConfig,
      schema: 'test',
      cache: false,
      extra: {
        max: 5,
        connectionTimeoutMillis: 2000,
        idleTimeoutMillis: 1000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 0,
        options: '-c search_path=test,public',
      },
    };
  }

  return baseConfig;
}
