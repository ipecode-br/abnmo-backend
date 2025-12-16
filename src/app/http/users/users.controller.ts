import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthUser } from '@/common/decorators/auth-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { GetUserResponse } from '@/domain/schemas/user/responses';

import type { AuthUserDto } from '../auth/auth.dtos';
import { UsersService } from './users.service';

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @Roles(['manager', 'nurse', 'specialist', 'patient'])
  async getProfile(
    @AuthUser() authUser: AuthUserDto,
  ): Promise<GetUserResponse> {
    const user = await this.usersService.getProfile(authUser.id);

    return {
      success: true,
      message: 'Dados do usuário retornado com sucesso.',
      data: user,
    };
  }
}
