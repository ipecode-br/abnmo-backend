import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import { PatientSupport } from '@/domain/entities/patient-support';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';

config();

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, Token, Patient, PatientSupport],
  migrations: ['infra/database/migrations/**/*.ts'],
  synchronize: false,
});

export default dataSource;
