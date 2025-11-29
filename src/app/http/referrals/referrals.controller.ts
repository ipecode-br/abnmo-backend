import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponseSchema } from '@/domain/schemas/base';
import { UserSchema } from '@/domain/schemas/user';

import { CreateReferralDto } from './referrals.dtos';
import { ReferralsService } from './referrals.service';

@ApiTags('Encaminhamentos')
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Post()
  @Roles(['manager', 'nurse'])
  @ApiOperation({ summary: 'Cadastra novo encaminhamento.' })
  async create(
    @Body() createReferralDto: CreateReferralDto,
    @CurrentUser() currentUser: UserSchema,
  ): Promise<BaseResponseSchema> {
    await this.referralsService.create(createReferralDto, currentUser.id);

    return { success: true, message: 'Encaminhamento cadastrado com sucesso.' };
  }

  @Patch(':id/cancel')
  @Roles(['nurse', 'manager', 'specialist'])
  @ApiOperation({ summary: 'Cancela um encaminhamento.' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: UserSchema,
  ): Promise<BaseResponseSchema> {
    await this.referralsService.cancel(id, user);

    return {
      success: true,
      message: 'Encaminhamento cancelado com sucesso.',
    };
  }
}
