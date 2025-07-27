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
        const isProduction = envService.get('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            autoLogging: false,
            formatters: { level: (label) => ({ level: label }) },
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'UTC:yyyy-mm-dd HH:MM:ss.l',
                    ignore: 'req,res',
                  },
                },
          },
        };
      },
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    PatientSupportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
