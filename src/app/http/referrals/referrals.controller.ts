import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponseSchema } from '@/domain/schemas/base';
import { UserSchema } from '@/domain/schemas/user';

import { CreateReferralsDto } from './referrals.dtos';
import { ReferralsService } from './referrals.service';

@ApiTags('Encaminhamentos')
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Post()
  @Roles(['manager', 'nurse'])
  @ApiOperation({ summary: 'Cadastra novo encaminhamento.' })
  async create(
    @Body() createReferralsDto: CreateReferralsDto,
    @CurrentUser() currentUser: UserSchema,
  ): Promise<BaseResponseSchema> {
    await this.referralsService.create(createReferralsDto, currentUser.id);
    return { success: true, message: 'Encaminhamento cadastrado com sucesso.' };
  }
}
