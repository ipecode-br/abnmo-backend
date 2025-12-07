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
import type { GetReferralsResponseSchema } from '@/domain/schemas/referral';
import { UserSchema } from '@/domain/schemas/user';

import { CreateReferralDto, GetReferralsQuery } from './referrals.dtos';
import { ReferralsService } from './referrals.service';
import { GetReferralsUseCase } from './use-cases/get-referrals-use-case';

@ApiTags('Encaminhamentos')
@Controller('referrals')
export class ReferralsController {
  constructor(
    private readonly getReferrals: GetReferralsUseCase,
    private readonly referralsService: ReferralsService,
  ) {}

  @Get()
  @Roles(['manager', 'nurse'])
  @ApiOperation({ summary: 'Lista encaminhamentos cadastrados no sistema' })
  async handleGetReferrals(
    @Query() query: GetReferralsQuery,
  ): Promise<GetReferralsResponseSchema> {
    const data = await this.getReferrals.execute({ query });

    return {
      success: true,
      message: 'Lista de encaminhamentos retornada com sucesso.',
      data,
    };
  }

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
