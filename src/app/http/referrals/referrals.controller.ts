import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponseSchema } from '@/domain/schemas/base';
import {
  GetReferralByCategoryResponse,
  ReferralByCategoryType,
} from '@/domain/schemas/referral';
import { UserSchema } from '@/domain/schemas/user';

import { CreateReferralDto, GetReferralByPeriodDto } from './referrals.dtos';
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

  @Get('referrals-by-category')
  @Roles(['manager', 'nurse'])
  @ApiOperation({ summary: 'Encaminhamentos por categoria.' })
  async getReferralByCategory(
    @Query() query: GetReferralByPeriodDto,
  ): Promise<GetReferralByCategoryResponse> {
    const { items: categories, total } =
      await this.referralsService.getReferralByPeriod<ReferralByCategoryType>(
        'category',
        query,
      );

    return {
      success: true,
      message: 'Encaminhamentos por categorias retornado com sucesso.',
      data: { categories, total },
    };
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
