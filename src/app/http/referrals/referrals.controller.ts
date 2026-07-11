import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { RequireFeature } from '@/common/decorators/require-feature.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse } from '@/common/dtos';
import { Log } from '@/common/log/log.decorator';
import type { RequestUser } from '@/common/types';

import {
  CreateReferralBody,
  GetReferralsQuery,
  GetReferralsResponse,
  UpdateReferralBody,
} from './referrals.dtos';
import { CancelReferralUseCase } from './use-cases/cancel-referral.use-case';
import { CreateReferralUseCase } from './use-cases/create-referrals.use-case';
import { GetReferralsUseCase } from './use-cases/get-referrals.use-case';
import { UpdateReferralUseCase } from './use-cases/update-referral.use-case';

@ApiTags('Encaminhamentos')
@Controller('referrals')
@Roles(['all'])
export class ReferralsController {
  constructor(
    private readonly cancelReferralUseCase: CancelReferralUseCase,
    private readonly createReferralUseCase: CreateReferralUseCase,
    private readonly getReferralsUseCase: GetReferralsUseCase,
    private readonly updateReferralUseCase: UpdateReferralUseCase,
  ) {}

  @Get()
  @RequireFeature(['read:referral', 'read:referral:others'])
  @ApiOperation({ summary: 'Lista todos os encaminhamentos' })
  @ZodResponse({ type: GetReferralsResponse, status: 200 })
  async getReferrals(
    @Query() query: GetReferralsQuery,
    @User() user: RequestUser,
  ): Promise<GetReferralsResponse> {
    const data = await this.getReferralsUseCase.execute({ user, ...query });

    return {
      success: true,
      message: 'Lista de encaminhamentos retornada com sucesso.',
      data,
    };
  }

  @Post()
  @Log('create_referral')
  @RequireFeature('create:referral')
  @ApiOperation({ summary: 'Cadastra um novo encaminhamento' })
  @ZodResponse({ type: BaseResponse, status: 201 })
  async create(
    @User() user: RequestUser,
    @Body() body: CreateReferralBody,
  ): Promise<BaseResponse> {
    await this.createReferralUseCase.execute({ user, ...body });

    return { success: true, message: 'Encaminhamento cadastrado com sucesso.' };
  }

  @Put(':id')
  @Log('update_referral')
  @RequireFeature(['update:referral', 'update:referral:others'])
  @ApiOperation({ summary: 'Atualiza os dados do encaminhamento' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  public async update(
    @Param('id') id: string,
    @Body() body: UpdateReferralBody,
  ): Promise<BaseResponse> {
    await this.updateReferralUseCase.execute({ id, ...body });

    return {
      success: true,
      message: 'Encaminhamento atualizado com sucesso.',
    };
  }

  @Patch(':id/cancel')
  @Log('cancel_referral')
  @RequireFeature(['cancel:referral', 'cancel:referral:others'])
  @ApiOperation({ summary: 'Cancela o encaminhamento' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async cancel(@Param('id') id: string): Promise<BaseResponse> {
    await this.cancelReferralUseCase.execute({ id });

    return {
      success: true,
      message: 'Encaminhamento cancelado com sucesso.',
    };
  }
}
