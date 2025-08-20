import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { envSchema } from '@/env/env';
import { EnvModule } from '@/env/env.module';
import { EnvService } from '@/env/env.service';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './http/auth/auth.module';
import { PatientSupportsModule } from './http/patient-supports/patient-supports.module';
import { PatientsModule } from './http/patients/patients.module';
import { StatisticsModule } from './http/statistics/statistics.module';
import { UsersModule } from './http/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => envSchema.parse(env),
    }),
    EnvModule,
    LoggerModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (envService: EnvService) => {
        const isLocal = envService.get('APP_ENVIRONMENT') === 'local';
        return {
          pinoHttp: {
            autoLogging: false,
            formatters: { level: (label) => ({ level: label }) },
            transport: isLocal
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'UTC:yyyy-mm-dd HH:MM:ss.l',
                    ignore: 'req,res',
                  },
                }
              : undefined,
          },
        };
      },
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    PatientSupportsModule,
    StatisticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
