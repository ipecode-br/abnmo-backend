import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Patient } from '../patient/entities/patient.entity';
import { Diagnosis } from '../diagnosis/entities/diagnosis.entity';
import { Support } from '../support/entities/support.entity';

config();

const configService = new ConfigService();

const dataSource = new DataSource({
  type: 'mysql',
  host: configService.get<string>('DB_HOST'), // Endereço do servidor DB
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USERNAME_DEV'), // Usuário de dev
  password: configService.get<string>('DB_PASSWORD_DEV'), // Senha de dev
  database: configService.get<string>('DB_DATABASE'), // Nome do banco
  entities: [User, Patient, Diagnosis, Support],
  migrations: ['src/database/migrations/**.ts'],
  synchronize: false,
});

export default dataSource;
