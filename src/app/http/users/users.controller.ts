import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthUser } from '@/common/decorators/auth-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { GetUserResponse } from '@/domain/schemas/users/responses';

import type { AuthUserDto } from '../auth/auth.dtos';
import { GetUserUseCase } from './use-cases/get-user.use-case';

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  constructor(private readonly getUserUseCase: GetUserUseCase) {}

  @Get('profile')
  @Roles(['manager', 'nurse', 'specialist'])
  async getProfile(@AuthUser() user: AuthUserDto): Promise<GetUserResponse> {
    const data = await this.getUserUseCase.execute({ id: user.id });

    return {
      success: true,
      message: 'Dados do usuário retornado com sucesso.',
      data,
    };
  }
}
