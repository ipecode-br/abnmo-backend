import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { User } from '@/domain/entities/user';

// import { Diagnostic } from '@/domain/entities/diagnostic';
// import { Patient } from '@/domain/entities/patient';
// import { PatientSupport } from '@/domain/entities/patient-support';

config();

// TODO: uncomment entities
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [
    User,
    // Patient,
    // PatientSupport,
    // Diagnostic
  ],
  migrations: ['infra/database/migrations/**/*.ts'],
  synchronize: false,
});

export default dataSource;
