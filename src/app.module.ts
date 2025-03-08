import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosticoModule } from './diagnostico/diagnostico.module';
import { PacienteModule } from './paciente/paciente.module';
import { UserModule } from './user/user.module';

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
        host: configService.get<string>('DB_HOST', 'localhost'), // Endereço do servidor DB
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME_DEV', 'root'), // Usuário de dev
        password: configService.get<string>('DB_PASSWORD_DEV', 'root'), // Senha de dev
        database: configService.get<string>('DB_DATABASE', 'test'), // Nome do banco
        autoLoadEntities: true,
        synchronize: false, // Ajuste para produção // alterado para false para não pedir migration pois dev não tem permissão
        extra: {
          connectionLimit: 10, // Limite de conexões simultâneas
          connectTimeout: 10000, // 10 segundos para o timeout de conexão
        },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    PacienteModule,
    DiagnosticoModule,
  ],
})
export class AppModule {}
