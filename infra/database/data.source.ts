import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { Diagnostic } from '@/domain/entities/diagnostic';
import { Patient } from '@/domain/entities/patient';
import { PatientSupport } from '@/domain/entities/patient-support';
import { User } from '@/domain/entities/user';

config();

const configService = new ConfigService();

const dataSource = new DataSource({
  type: 'mysql',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_EXTERNAL_PORT'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_DATABASE'),
  entities: [User, Patient, PatientSupport, Diagnostic],
  migrations: ['infra/database/migrations/**/*.ts'],
  synchronize: false,
});

export default dataSource;
