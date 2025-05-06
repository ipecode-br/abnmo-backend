import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Caminho para o arquivo .env
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'), // Endereço do servidor DB
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME_DEV'), // Usuário de dev
        password: configService.get<string>('DB_PASSWORD_DEV'), // Senha de dev
        database: configService.get<string>('DB_DATABASE'), // Nome do banco
        entities: [User, Diagnosis, Patient, Support],
        migrations: [__dirname + '/database/migrations/*.ts'],
        synchronize: false, // Ajuste para produção // alterado para false para não pedir migration pois dev não tem permissão
        extra: {
          connectionLimit: 10, // Limite de conexões simultâneas
          connectTimeout: 10000, // 10 segundos para o timeout de conexão
        },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    PatientModule,
    DiagnosisModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
