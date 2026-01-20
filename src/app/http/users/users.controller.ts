import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthUser } from '@/common/decorators/auth-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponse } from '@/common/dtos';

import type { AuthUserDto } from '../auth/auth.dtos';
import { CreateUserInviteUseCase } from './use-cases/create-user-invite.use-case';
import { GetUserUseCase } from './use-cases/get-user.use-case';
import { GetUsersUseCase } from './use-cases/get-users.use-case';
import {
  CreateUserInviteDto,
  GetUserResponse,
  GetUsersQuery,
  GetUsersResponse,
} from './users.dtos';

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserInviteUseCase: CreateUserInviteUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
  ) {}

  @Post('invite')
  @Roles(['manager'])
  @ApiOperation({ summary: 'Cria convite para registro de usuário' })
  @ApiResponse({ type: BaseResponse })
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

  @Get()
  @Roles(['manager'])
  @ApiOperation({ summary: 'Lista todos os usuários' })
  @ApiResponse({ type: GetUsersResponse })
  async getUsers(@Query() query: GetUsersQuery): Promise<GetUsersResponse> {
    const data = await this.getUsersUseCase.execute({ query });

    return {
      success: true,
      message: 'Lista de usuários retornada com sucesso.',
      data,
    };
  }

  @Get('me')
  @Roles(['manager', 'nurse', 'specialist'])
  @ApiOperation({ summary: 'Retorna os dados do usuário autenticado' })
  @ApiResponse({ type: GetUserResponse })
  async getProfile(@AuthUser() user: AuthUserDto): Promise<GetUserResponse> {
    const { user: data } = await this.getUserUseCase.execute({ id: user.id });

    return {
      success: true,
      message: 'Dados do usuário retornados com sucesso.',
      data,
    };
  }
}
