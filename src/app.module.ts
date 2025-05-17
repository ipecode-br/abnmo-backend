import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiagnosisModule } from './diagnosis/diagnosis.module';
import { PatientModule } from './patient/patient.module';
import { UserModule } from './user/user.module';
import { SupportModule } from './support/support.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envSchema } from '../infra/env/env';
import { EnvModule } from '../infra/env/env.module';
import { DatabaseModule } from '../infra/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => envSchema.parse(env),
    }),
    EnvModule,
    DatabaseModule,
    UserModule,
    PatientModule,
    DiagnosisModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
