import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvModule } from '../env/env.module';
import { EnvService } from '../env/env.service';
import { User } from 'src/user/entities/user.entity';
import { Diagnosis } from 'src/diagnosis/entities/diagnosis.entity';
import { Patient } from 'src/patient/entities/patient.entity';
import { Support } from 'src/support/entities/support.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        type: 'mysql',
        host: env.get('DB_HOST'),
        port: env.get('DB_EXTERNAL_PORT'),
        database: env.get('DB_DATABASE'),
        username: env.get('DB_USERNAME'),
        password: env.get('DB_PASSWORD'),
        entities: [User, Diagnosis, Patient, Support],
        migrations: [__dirname + '/../../database/migrations/*.ts'],
        synchronize: false,
        extra: {
          connectionLimit: 10,
          connectTimeout: 10000,
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
