import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { DatabaseModule } from './infra/database/database.module';
import { envSchema } from './infra/env/env';
import { EnvModule } from './infra/env/env.module';
import { PatientSupportsModule } from './patient-supports/patient-supports.module';
import { PatientsModule } from './patients/patients.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => envSchema.parse(env),
    }),
    EnvModule,
    DatabaseModule,
    UsersModule,
    PatientsModule,
    PatientSupportsModule,
    DiagnosticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
