import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { Diagnostic } from '@/diagnostics/entities/diagnostic.entity';
import { PatientSupport } from '@/patient-supports/entities/patient-support.entity';
import { Patient } from '@/patients/entities/patient.entity';
import { User } from '@/users/entities/user.entity';

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
  migrations: ['src/infra/database/migrations/**/*.ts'],
  synchronize: false,
});

export default dataSource;
