import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CryptographyModule } from '@/app/cryptography/cryptography.module';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';

import { CreateUserInviteUseCase } from './use-cases/create-user-invite.use-case';
import { GetUserUseCase } from './use-cases/get-user.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Token]), CryptographyModule],
  providers: [CreateUserInviteUseCase, UpdateUserUseCase, GetUserUseCase],
  controllers: [UsersController],
})
export class UsersModule {}
