import { DataSource } from 'typeorm';

import { SnakeNamingStrategy } from '@/config/snake-naming.strategy';
import { DATABASE_ENTITIES } from '@/domain/entities/database';

import { env } from './env';

let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (!dataSource) {
    dataSource = new DataSource({
      type: 'postgres',
      host: env.DB_HOST,
      port: env.DB_PORT,
      username: env.DB_USERNAME,
      password: env.DB_PASSWORD,
      database: env.DB_DATABASE,
      entities: DATABASE_ENTITIES,
      namingStrategy: new SnakeNamingStrategy(),
      synchronize: false,
      ...(env.DB_SCHEMA && { schema: env.DB_SCHEMA }),
    });
  }

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  return dataSource;
}
