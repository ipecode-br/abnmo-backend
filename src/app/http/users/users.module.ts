import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CryptographyModule } from '@/app/cryptography/cryptography.module';
import { MailModule } from '@/app/mail/mail.module';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { EnvModule } from '@/env/env.module';

import { ActivateUserUseCase } from './use-cases/activate-user.use-case';
import { CancelUserInviteUseCase } from './use-cases/cancel-user-invite.use-case';
import { CreateUserInviteUseCase } from './use-cases/create-user-invite.use-case';
import { DeactivateUserUseCase } from './use-cases/deactivate-user.use-case';
import { GetUserUseCase } from './use-cases/get-user.use-case';
import { GetUserInvitesUseCase } from './use-cases/get-user-invites.use-case';
import { GetUsersUseCase } from './use-cases/get-users.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Token, Patient]),
    CryptographyModule,
    EnvModule,
    MailModule,
  ],
  providers: [
    ActivateUserUseCase,
    CancelUserInviteUseCase,
    CreateUserInviteUseCase,
    DeactivateUserUseCase,
    GetUserUseCase,
    GetUsersUseCase,
    GetUserInvitesUseCase,
    UpdateUserUseCase,
  ],
  controllers: [UsersController],
})
export class UsersModule {}
