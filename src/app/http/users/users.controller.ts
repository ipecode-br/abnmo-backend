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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Express } from 'express';
import { ZodResponse } from 'nestjs-zod';

import { RequireFeature } from '@/common/decorators/require-feature.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse } from '@/common/dtos';
import { FileValidationPipe } from '@/common/file-validation.pipe';
import { Log } from '@/common/log/log.decorator';
import type { RequestUser } from '@/common/types';
import { MIME_TYPES } from '@/constants/mime-types';

import { ActivateUserUseCase } from './use-cases/activate-user.use-case';
import { CancelUserInviteUseCase } from './use-cases/cancel-user-invite.use-case';
import { CreateUserInviteUseCase } from './use-cases/create-user-invite.use-case';
import { DeactivateUserUseCase } from './use-cases/deactivate-user.use-case';
import { GetUserUseCase } from './use-cases/get-user.use-case';
import { GetUserInvitesUseCase } from './use-cases/get-user-invites.use-case';
import { GetUsersUseCase } from './use-cases/get-users.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { UploadUserAvatarUseCase } from './use-cases/upload-user-avatar.use-case';
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
@Roles(['admin'])
@Controller('users')
export class UsersController {
  constructor(
    private readonly activateUserUseCase: ActivateUserUseCase,
    private readonly cancelUserInviteUseCase: CancelUserInviteUseCase,
    private readonly createUserInviteUseCase: CreateUserInviteUseCase,
    private readonly deactivateUserUseCase: DeactivateUserUseCase,
    private readonly getUserInvitesUseCase: GetUserInvitesUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly uploadUserAvatarUseCase: UploadUserAvatarUseCase,
  ) {}

  @Get()
  @RequireFeature('read:user:others')
  @ApiOperation({ summary: 'Lista todos os usuários' })
  @ZodResponse({ type: GetUsersResponse, status: 200 })
  async getUsers(@Query() query: GetUsersQuery): Promise<GetUsersResponse> {
    const data = await this.getUsersUseCase.execute(query);

    return {
      success: true,
      message: 'Lista de usuários retornada com sucesso.',
      data,
    };
  }

  @Get('me')
  @Roles(['member', 'specialist'])
  @RequireFeature('read:user')
  @ApiOperation({ summary: 'Retorna os dados do usuário autenticado' })
  @ZodResponse({ type: GetUserResponse, status: 200 })
  async getProfile(@User() user: RequestUser): Promise<GetUserResponse> {
    const data = await this.getUserUseCase.execute({ id: user.id });

    return {
      success: true,
      message: 'Dados do usuário retornados com sucesso.',
      data,
    };
  }

  @Put(':id')
  @Log('update_user')
  @RequireFeature('update:user')
  @ApiOperation({ summary: 'Atualiza os dados do usuário' })
  @ZodResponse({ type: BaseResponse, status: 204 })
  async updateUser(
    @Param('id') id: string,
    @User() user: RequestUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<BaseResponse> {
    await this.updateUserUseCase.execute({ id, user, ...updateUserDto });

    return {
      success: true,
      message: 'Usuário atualizado com sucesso.',
    };
  }

  @Post('upload-avatar')
  @Log('update_user')
  @RequireFeature('update:user')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Faz upload do avatar do usuário' })
  @ZodResponse({ type: BaseResponse, status: 201 })
  async uploadAvatar(
    @User() user: RequestUser,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 500 * 1024, // 500kb
        allowedMimeTypes: [MIME_TYPES.jpg, MIME_TYPES.jpeg, MIME_TYPES.png],
      }),
    )
    file: Express.Multer.File,
  ): Promise<BaseResponse> {
    await this.uploadUserAvatarUseCase.execute({
      user,
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
    });

    return {
      success: true,
      message: 'Avatar atualizado com sucesso.',
    };
  }

  @Patch(':id/deactivate')
  @Log('deactivate_user')
  @RequireFeature('deactivate:user')
  @ApiOperation({ summary: 'Inativa o usuário' })
  @ZodResponse({ type: BaseResponse, status: 204 })
  async deactivateUser(
    @Param('id') id: string,
    @User() user: RequestUser,
  ): Promise<BaseResponse> {
    await this.deactivateUserUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Usuário inativado com sucesso.',
    };
  }

  @Patch(':id/activate')
  @Log('activate_user')
  @RequireFeature('activate:user')
  @ApiOperation({ summary: 'Ativa o usuário' })
  @ZodResponse({ type: BaseResponse, status: 204 })
  async activateUser(
    @Param('id') id: string,
    @User() user: RequestUser,
  ): Promise<BaseResponse> {
    await this.activateUserUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Usuário ativado com sucesso.',
    };
  }

  @Get('invites')
  @RequireFeature('read:user_invite')
  @ApiOperation({ summary: 'Lista todos os convites de usuário' })
  @ZodResponse({ type: GetUserInvitesResponse, status: 200 })
  async getUserInvites(@Query() query: GetUserInvitesQuery): Promise<any> {
    const data = await this.getUserInvitesUseCase.execute(query);

    return {
      success: true,
      message: 'Lista de convites retornada com sucesso.',
      data,
    };
  }

  @Post('invites')
  @Log('create_user_invite')
  @RequireFeature('create:user_invite')
  @ApiOperation({ summary: 'Cria convite para registro de usuário' })
  @ZodResponse({ type: BaseResponse, status: 201 })
  async createUserInvite(
    @Body() createUserInviteDto: CreateUserInviteDto,
  ): Promise<BaseResponse> {
    await this.createUserInviteUseCase.execute(createUserInviteDto);

    return {
      success: true,
      message: 'Convite do usuário enviado com sucesso.',
    };
  }

  @Delete('invites/:id')
  @Log('cancel_user_invite')
  @RequireFeature('delete:user_invite')
  @ApiOperation({ summary: 'Cancela convite de usuário' })
  @ZodResponse({ type: BaseResponse, status: 204 })
  async cancelUserInvite(@Param('id') id: string): Promise<BaseResponse> {
    await this.cancelUserInviteUseCase.execute({ id });

    return {
      success: true,
      message: 'Convite cancelado com sucesso.',
    };
  }
}
