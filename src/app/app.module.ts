import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ZodSerializerInterceptor } from 'nestjs-zod';

import { ContextMiddleware } from '@/common/context/context.middleware';
import { HttpExceptionFilter } from '@/common/http-exception.filter';
import { LogGuard } from '@/common/log/log.guard';
import { LogModule } from '@/common/log/log.module';
import { MaintenanceMiddleware } from '@/common/maintenance.middleware';
import { ZodValidationPipe } from '@/common/zod-validation.pipe';
import { envSchema } from '@/env/env';
import { EnvModule } from '@/env/env.module';
import { EnvService } from '@/env/env.service';

import { DatabaseModule } from './database/database.module';
import { AppointmentsModule } from './http/appointments/appointments.module';
import { AuthModule } from './http/auth/auth.module';
import { PatientRequirementsModule } from './http/patient-requirements/patient-requirements.module';
import { PatientsModule } from './http/patients/patients.module';
import { ReferralsModule } from './http/referrals/referrals.module';
import { StatisticsModule } from './http/statistics/statistics.module';
import { StatusModule } from './http/status/status.module';
import { SurveysModule } from './http/surveys/surveys.module';
import { UsersModule } from './http/users/users.module';
import { WebhooksModule } from './http/webhooks/webhooks.module';
import { StorageModule } from './storage/storage.module';

/**
 * Root application module with global pipes and filters for validation and error handling.
 * Uses nestjs-zod for Zod-based validation: https://github.com/BenLorantfy/nestjs-zod
 */

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      validate: (env) => envSchema.parse(env),
    }),
    EnvModule,
    LoggerModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (envService: EnvService) => {
        const isTest = envService.get('NODE_ENV') === 'test';
        const usePinoPretty = envService.get('APP_ENVIRONMENT') !== 'lambda';
        return {
          pinoHttp: {
            autoLogging: false,
            level: isTest ? 'silent' : 'info',
            formatters: { level: (label) => ({ level: label }) },
            transport:
              usePinoPretty && !isTest
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
    LogModule,
    DatabaseModule,
    SurveysModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    ReferralsModule,
    AppointmentsModule,
    StatisticsModule,
    PatientRequirementsModule,
    StorageModule,
    StatusModule,
    WebhooksModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: LogGuard },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ContextMiddleware, MaintenanceMiddleware).forRoutes('*');
  }
}
