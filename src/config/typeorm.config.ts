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
    synchronize: false, // Disable synchronization for better performance
    logging: false,
    migrations: [], // Don't run migrations in test mode
    extra: {
      connectionLimit: 3, // Reduced connection limit for tests
      connectTimeout: 5000, // Faster timeout
      acquireTimeout: 3000, // Faster acquire timeout
      timeout: 3000, // Query timeout
      charset: 'utf8mb4_unicode_ci',
      // MySQL-specific optimizations for tests
      ssl: false,
    },
    // Additional performance optimizations
    cache: false, // Disable caching in tests
    dropSchema: false, // Don't drop schema
    migrationsRun: false, // Don't run migrations
  };
};
