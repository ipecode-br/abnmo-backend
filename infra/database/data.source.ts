import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { DATABASE_ENTITIES } from '@/domain/entities/database';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
config({ path: envFile });

const isTestEnv = process.env.NODE_ENV === 'test';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  migrations: [
    process.env.APP_ENVIRONMENT === 'docker'
      ? 'dist/infra/database/migrations/*.js'
      : 'infra/database/migrations/*.ts',
  ],
  entities: DATABASE_ENTITIES,
  synchronize: false,
  namingStrategy: new SnakeNamingStrategy(),
  ...(isTestEnv && {
    extra: {
      options: '-c search_path=test,public',
    },
  }),
});

export default dataSource;
