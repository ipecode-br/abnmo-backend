import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { DATABASE_ENTITIES } from '@/domain/entities/database';

config();

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: DATABASE_ENTITIES,
  migrations: ['infra/database/migrations/**/*.ts'],
  synchronize: false,
});

export default dataSource;
