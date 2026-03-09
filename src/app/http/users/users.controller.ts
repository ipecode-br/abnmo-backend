import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse } from '@/common/dtos';
import type { AuthUser } from '@/common/types';

import { ActivateUserUseCase } from './use-cases/activate-user.use-case';
import { CancelUserInviteUseCase } from './use-cases/cancel-user-invite.use-case';
import { CreateUserInviteUseCase } from './use-cases/create-user-invite.use-case';
import { DeactivateUserUseCase } from './use-cases/deactivate-user.use-case';
import { GetUserUseCase } from './use-cases/get-user.use-case';
import { GetUserInvitesUseCase } from './use-cases/get-user-invites.use-case';
import { GetUsersUseCase } from './use-cases/get-users.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import {
  CreateUserInviteDto,
  GetUserInvitesQuery,
  GetUserInvitesResponse,
  GetUserResponse,
  GetUsersQuery,
  GetUsersResponse,
  UpdateUserDto,
} from './users.dtos';

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  constructor(
    private readonly activateUserUseCase: ActivateUserUseCase,
    private readonly createUserInviteUseCase: CreateUserInviteUseCase,
    private readonly deactivateUserUseCase: DeactivateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly getUserInvitesUseCase: GetUserInvitesUseCase,
    private readonly cancelUserInviteUseCase: CancelUserInviteUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) {}

  @Get()
  @Roles(['manager'])
  @ApiOperation({ summary: 'Lista todos os usuários' })
  @ApiResponse({ type: GetUsersResponse })
  async getUsers(@Query() query: GetUsersQuery): Promise<GetUsersResponse> {
    const data = await this.getUsersUseCase.execute(query);

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
  async getProfile(@User() user: AuthUser): Promise<GetUserResponse> {
    const { user: data } = await this.getUserUseCase.execute({ id: user.id });

    return {
      success: true,
      message: 'Dados do usuário retornados com sucesso.',
      data,
    };
  }

  @Post('invites')
  @Roles(['manager'])
  @ApiOperation({ summary: 'Cria convite para registro de usuário' })
  @ApiResponse({ type: BaseResponse })
  async createUserInvite(
    @Body() createUserInviteDto: CreateUserInviteDto,
  ): Promise<BaseResponse> {
    await this.createUserInviteUseCase.execute(createUserInviteDto);

    return {
      success: true,
      message: 'Convite do usuário enviado com sucesso.',
    };
  }

  @Get('invites')
  @Roles(['manager'])
  @ApiOperation({ summary: 'Lista todos os convites de usuário' })
  @ApiResponse({ type: GetUserInvitesResponse })
  async getUserInvites(@Query() query: GetUserInvitesQuery): Promise<any> {
    const data = await this.getUserInvitesUseCase.execute(query);

    return {
      success: true,
      message: 'Lista de convites retornada com sucesso.',
      data,
    };
  }

  @Put(':id')
  @Roles(['manager', 'nurse', 'specialist'])
  @ApiOperation({ summary: 'Atualiza os dados do usuário' })
  @ApiResponse({ type: BaseResponse })
  async updateUser(
    @Param('id') id: string,
    @User() user: AuthUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<BaseResponse> {
    await this.updateUserUseCase.execute({ id, user, ...updateUserDto });

    return {
      success: true,
      message: 'Usuário atualizado com sucesso.',
    };
  }

  @Delete('invites/:id')
  @Roles(['manager'])
  @ApiOperation({ summary: 'Cancela convite de usuário' })
  @ApiResponse({ type: BaseResponse })
  async cancelUserInvite(@Param('id') id: string): Promise<BaseResponse> {
    await this.cancelUserInviteUseCase.execute({ id: parseInt(id, 10) });

    return {
      success: true,
      message: 'Convite cancelado com sucesso.',
    };
  }

  @Patch(':id/deactivate')
  @Roles(['admin'])
  @ApiOperation({ summary: 'Inativa o usuário' })
  @ApiResponse({ type: BaseResponse })
  async deactivateUser(
    @Param('id') id: string,
    @User() user: AuthUser,
  ): Promise<BaseResponse> {
    await this.deactivateUserUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Usuário inativado com sucesso.',
    };
  }

  @Patch(':id/activate')
  @Roles(['admin'])
  @ApiOperation({ summary: 'Ativa o usuário' })
  @ApiResponse({ type: BaseResponse })
  async activateUser(
    @Param('id') id: string,
    @User() user: AuthUser,
  ): Promise<BaseResponse> {
    await this.activateUserUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Usuário ativado com sucesso.',
    };
  }
}
