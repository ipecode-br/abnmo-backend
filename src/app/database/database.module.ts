import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Diagnostic } from '@/domain/entities/diagnostic';
import { Patient } from '@/domain/entities/patient';
import { PatientSupport } from '@/domain/entities/patient-support';
import { User } from '@/domain/entities/user';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        console.log(configService);

        return {
          type: 'mysql',
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          database: configService.get('DB_DATABASE'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          entities: [User, Patient, PatientSupport, Diagnostic],
          migrations: [__dirname + 'infra/database/migrations/**/*.ts'],
          synchronize: false,
          extra: {
            connectionLimit: 10,
            connectTimeout: 10000,
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
