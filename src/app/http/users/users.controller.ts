import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthUser } from '@/common/decorators/auth-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { BaseResponse } from '@/domain/schemas/base';
import type { GetUserResponse } from '@/domain/schemas/users/responses';

import type { AuthUserDto } from '../auth/auth.dtos';
import { CreateUserInviteUseCase } from './use-cases/create-user-invite.use-case';
import { GetUserUseCase } from './use-cases/get-user.use-case';
import { CreateUserInviteDto } from './users.dtos';

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserInviteUseCase: CreateUserInviteUseCase,
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  @Post('invite')
  @Roles(['manager'])
  async createUserInvite(
    @AuthUser() user: AuthUserDto,
    @Body() createUserInviteDto: CreateUserInviteDto,
  ): Promise<BaseResponse> {
    await this.createUserInviteUseCase.execute({ user, createUserInviteDto });

    return {
      success: true,
      message: 'Convite do usuário criado com sucesso.',
    };
  }

  @Get('me')
  @Roles(['manager', 'nurse', 'specialist'])
  async getProfile(@AuthUser() user: AuthUserDto): Promise<GetUserResponse> {
    const { user: data } = await this.getUserUseCase.execute({ id: user.id });

    return {
      success: true,
      message: 'Dados do usuário retornado com sucesso.',
      data,
    };
  }
}
