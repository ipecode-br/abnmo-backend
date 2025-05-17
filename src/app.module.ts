import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosisModule } from './diagnosis/diagnosis.module';
import { PatientModule } from './patient/patient.module';
import { UserModule } from './user/user.module';
import { SupportModule } from './support/support.module';
import { User } from './user/entities/user.entity';
import { Diagnosis } from './diagnosis/entities/diagnosis.entity';
import { Patient } from './patient/entities/patient.entity';
import { Support } from './support/entities/support.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envSchema } from './infra/env/env';
import { EnvModule } from './infra/env/env.module';
import { EnvService } from './infra/env/env.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => envSchema.parse(env),
    }),
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
        entities: [User, Diagnosis, Patient, Support],
        migrations: [__dirname + '/database/migrations/*.ts'],
        synchronize: false, // Do not request migration on production environment
        extra: {
          connectionLimit: 10,
          connectTimeout: 10000,
        },
      }),
    }),
    EnvModule,
    UserModule,
    PatientModule,
    DiagnosisModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
