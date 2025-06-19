import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { envSchema } from '@/env/env';
import { EnvModule } from '@/env/env.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './http/auth/auth.module';
import { UsersModule } from './http/users/users.module';

// TODO: uncomment modules
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
    // PatientsModule,
    // PatientSupportsModule,
    // DiagnosticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
