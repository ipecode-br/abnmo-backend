import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { envSchema } from '@/env/env';
import { EnvModule } from '@/env/env.module';

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
