import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type {
  GetUserProfileResponseSchema,
  UserSchema,
} from '@/domain/schemas/user';

import { UsersService } from './users.service';

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(
    @CurrentUser() requestUser: UserSchema,
  ): Promise<GetUserProfileResponseSchema> {
    const user = await this.usersService.getProfile(requestUser.id);

    return {
      success: true,
      message: 'Dados do usuário retornado com sucesso.',
      data: user,
    };
  }

  // TODO: update other endpoints
  // @Get()
  // @ApiOperation({ summary: 'Retorna todos os usuários' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Lista de usuários retornada com sucesso',
  //   type: [User],
  // })
  // public async findAll(): Promise<EnvelopeDTO<User[], undefined>> {
  //   try {
  //     const users = await this.userService.findAll();
  //     if (!users) {
  //       return {
  //         success: false,
  //         message: 'Erro ao encontrar usuários',
  //         data: undefined,
  //       };
  //     }
  //     return {
  //       success: true,
  //       message: 'Lista de usuários',
  //       data: users,
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message:
  //         error instanceof Error
  //           ? error.message
  //           : 'Erro interno ao encontrar usuários',
  //       data: undefined,
  //     };
  //   }
  // }

  // @Get(':id')
  // @ApiOperation({ summary: 'Busca um usuário pelo ID' })
  // @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  // @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  // @ApiParam({ name: 'id', type: 'number', description: 'ID do usuário' })
  // public async findById(
  //   @Param('id', ParseIntPipe) id: number,
  // ): Promise<EnvelopeDTO<User, undefined>> {
  //   try {
  //     const user = await this.userService.findById(id);
  //     if (!user) {
  //       return {
  //         success: false,
  //         message: 'Erro ao encontrar usuário!',
  //         data: undefined,
  //       };
  //     }
  //     this.logger.log(`Usuário encontrado`);

  //     return {
  //       success: true,
  //       message: 'Usuário encontrado com sucesso!',
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message:
  //         error instanceof Error
  //           ? error.message
  //           : 'Erro  interno ao encontrar usuário!',
  //       data: undefined,
  //     };
  //   }
  // }

  // @Patch(':id')
  // @ApiOperation({ summary: 'Atualiza um usuário pelo ID' })
  // @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  // @ApiResponse({ status: 400, description: 'Dados inválidos' })
  // @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  // @ApiParam({ name: 'id', type: 'number', description: 'ID do usuário' })
  // @ApiBody({ type: UpdateUserDto })
  // public async update(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() updateUserDto: UpdateUserDto,
  // ): Promise<EnvelopeDTO<User, undefined>> {
  //   try {
  //     await validateDto(UpdateUserDto);

  //     const user = await this.userService.update(id, updateUserDto);
  //     if (!user) {
  //       return {
  //         success: false,
  //         message: 'Erro ao atualizar usuário!',
  //         data: undefined,
  //       };
  //     }
  //     this.logger.log(
  //       `Usuário atualizado com sucesso: ${JSON.stringify(user)}`,
  //     );

  //     return {
  //       success: true,
  //       message: 'Usuário atualizado com sucesso',
  //       data: user,
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message:
  //         error instanceof Error
  //           ? error.message
  //           : 'Erro interno ao atualizar usuário!',
  //       data: undefined,
  //     };
  //   }
  // }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Remove um usuário pelo ID' })
  // @ApiResponse({ status: 200, description: 'Usuário removido com sucesso' })
  // @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  // @ApiParam({ name: 'id', type: 'number', description: 'ID do usuário' })
  // public async remove(
  //   @Param('id', ParseIntPipe) id: number,
  // ): Promise<EnvelopeDTO<User, undefined>> {
  //   try {
  //     const user = await this.userService.remove(id);
  //     if (!user) {
  //       return {
  //         success: false,
  //         message: 'Erro ao remover usuário!',
  //         data: undefined,
  //       };
  //     }
  //     this.logger.log(`Usuário removido com sucesso: ${JSON.stringify(user)}`);

  //     return {
  //       success: true,
  //       message: 'Usuário removido com sucesso',
  //       data: user,
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message:
  //         error instanceof Error
  //           ? error.message
  //           : 'Erro interno ao remover usuário!',
  //       data: undefined,
  //     };
  //   }
  // }
}
