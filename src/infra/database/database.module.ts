import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Diagnostic } from '@/diagnostics/entities/diagnostic.entity';
import { EnvModule } from '@/infra/env/env.module';
import { EnvService } from '@/infra/env/env.service';
import { PatientSupport } from '@/patient-supports/entities/patient-support.entity';
import { Patient } from '@/patients/entities/patient.entity';
import { User } from '@/users/entities/user.entity';

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
        entities: [User, Patient, PatientSupport, Diagnostic],
        migrations: [__dirname + 'src/infra/database/migrations/**/*.ts'],
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
