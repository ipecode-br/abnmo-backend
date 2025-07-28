import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
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
  @Roles(['manager', 'nurse', 'specialist', 'patient'])
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
}
