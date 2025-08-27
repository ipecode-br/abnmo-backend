import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { DATABASE_ENTITIES } from '@/domain/entities/database';

import { databaseConfig } from './database.config';

export const typeOrmConfig = (): TypeOrmModuleOptions => {
  const config = databaseConfig();

  return {
    type: 'mysql',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    entities: DATABASE_ENTITIES,
    migrations: [__dirname + '/../infra/database/migrations/**/*.ts'],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    extra: {
      connectionLimit: 10,
      connectTimeout: 10000,
    },
  };
};

// Test-specific configuration
export const testTypeOrmConfig = (): TypeOrmModuleOptions => {
  const config = databaseConfig();

  return {
    type: 'mysql',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.schema || config.database, // Use test schema as database name in MySQL
    entities: DATABASE_ENTITIES,
    synchronize: true, // Auto-create tables in test schema
    logging: false,
    migrations: [], // Don't run migrations in test mode
    extra: {
      connectionLimit: 5,
      connectTimeout: 10000,
    },
  };
};
