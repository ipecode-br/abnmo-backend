import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Patient } from '@/domain/entities/patient';
import { PatientSupport } from '@/domain/entities/patient-support';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { EnvModule } from '@/env/env.module';
import { EnvService } from '@/env/env.service';

export const DATABASE_ENTITIES = [User, Token, Patient, PatientSupport];

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
        entities: DATABASE_ENTITIES,
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
