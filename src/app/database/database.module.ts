import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Diagnostic } from '@/domain/entities/diagnostic';
import { Patient } from '@/domain/entities/patient';
import { PatientSupport } from '@/domain/entities/patient-support';
import { User } from '@/domain/entities/user';
import { EnvModule } from '@/env/env.module';
import { EnvService } from '@/env/env.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        type: 'mysql',
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        database: env.get('DB_DATABASE'),
        username: env.get('DB_USERNAME'),
        password: env.get('DB_PASSWORD'),
        entities: [User, Patient, PatientSupport, Diagnostic],
        migrations: [__dirname + 'infra/database/migrations/**/*.ts'],
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
