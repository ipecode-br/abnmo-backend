import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { Diagnosis } from 'src/diagnosis/entities/diagnosis.entity';
import { Patient } from 'src/patient/entities/patient.entity';
import { Support } from 'src/support/entities/support.entity';
import { User } from 'src/user/entities/user.entity';
import { DataSource } from 'typeorm';

config();

const configService = new ConfigService();

const dataSource = new DataSource({
  type: 'mysql',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_EXTERNAL_PORT'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_DATABASE'),
  entities: [User, Patient, Diagnosis, Support],
  migrations: ['./infra/database/migrations/**.ts'],
  synchronize: false,
});

export default dataSource;
