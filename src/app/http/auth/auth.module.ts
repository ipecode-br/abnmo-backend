import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CryptographyModule } from '@/app/cryptography/cryptography.module';
import { MailModule } from '@/app/mail/mail.module';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { EnvModule } from '@/env/env.module';
import { UtilsModule } from '@/utils/utils.module';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokensRepository } from './tokens.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, Token, User]),
    CryptographyModule,
    UsersModule,
    UtilsModule,
    MailModule,
    EnvModule,
  ],
  providers: [
    AuthService,
    TokensRepository,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  controllers: [AuthController],
  exports: [AuthService, TokensRepository],
})
export class AuthModule {}
