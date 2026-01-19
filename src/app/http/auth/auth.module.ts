import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CryptographyModule } from '@/app/cryptography/cryptography.module';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { EnvModule } from '@/env/env.module';
import { UtilsModule } from '@/utils/utils.module';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { ChangePasswordUseCase } from './use-cases/change-password.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { RecoverPasswordUseCase } from './use-cases/recover-password.use-case';
import { RegisterPatientUseCase } from './use-cases/register-patient.use-case';
import { RegisterUserUseCase } from './use-cases/register-user.use-case';
import { ResetPasswordUseCase } from './use-cases/reset-password.use-case';
import { SignInWithEmailUseCase } from './use-cases/sign-in-with-email.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, Token, User]),
    CryptographyModule,
    UsersModule,
    UtilsModule,
    EnvModule,
  ],
  providers: [
    SignInWithEmailUseCase,
    LogoutUseCase,
    RecoverPasswordUseCase,
    ResetPasswordUseCase,
    RegisterPatientUseCase,
    RegisterUserUseCase,
    ChangePasswordUseCase,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
