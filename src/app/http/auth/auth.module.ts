import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CryptographyModule } from '@/app/cryptography/cryptography.module';
import { StorageModule } from '@/app/storage/storage.module';
import { AuthGuard } from '@/common/guards/auth.guard';
import { DashboardGuard } from '@/common/guards/dashboard.guard';
import { FeatureGuard } from '@/common/guards/feature.guard';
import { Session } from '@/domain/entities/session';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { EnvModule } from '@/env/env.module';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { ChangePasswordUseCase } from './use-cases/change-password.use-case';
import { CreateSessionUseCase } from './use-cases/create-session.use-case';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { ExpireSessionUseCase } from './use-cases/expire-session.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { RecoverPasswordUseCase } from './use-cases/recover-password.use-case';
import { ResetPasswordUseCase } from './use-cases/reset-password.use-case';
import { SignInWithEmailUseCase } from './use-cases/sign-in-with-email.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, Token, User]),
    CryptographyModule,
    EnvModule,
    StorageModule,
    UsersModule,
  ],
  providers: [
    ChangePasswordUseCase,
    CreateSessionUseCase,
    CreateUserUseCase,
    ExpireSessionUseCase,
    LogoutUseCase,
    RecoverPasswordUseCase,
    ResetPasswordUseCase,
    SignInWithEmailUseCase,
    { provide: APP_GUARD, useClass: DashboardGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: FeatureGuard },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
