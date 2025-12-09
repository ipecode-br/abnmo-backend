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
import type { GetReferralsResponseSchema } from '@/domain/schemas/referral/responses';
import { UserSchema } from '@/domain/schemas/user';

import { CreateReferralDto, GetReferralsQuery } from './referrals.dtos';
import { CancelReferralUseCase } from './use-cases/cancel-referral.use-case';
import { CreateReferralUseCase } from './use-cases/create-referrals.use-case';
import { GetReferralsUseCase } from './use-cases/get-referrals.use-case';

@ApiTags('Encaminhamentos')
@Controller('referrals')
export class ReferralsController {
  constructor(
    private readonly getReferralsUseCase: GetReferralsUseCase,
    private readonly createReferralUseCase: CreateReferralUseCase,
    private readonly cancelReferralUseCase: CancelReferralUseCase,
  ) {}

  @Get()
  @Roles(['manager', 'nurse'])
  @ApiOperation({ summary: 'Lista encaminhamentos cadastrados no sistema' })
  async getReferrals(
    @Query() query: GetReferralsQuery,
  ): Promise<GetReferralsResponseSchema> {
    const data = await this.getReferralsUseCase.execute({ query });

    return {
      success: true,
      message: 'Lista de encaminhamentos retornada com sucesso.',
      data,
    };
  }

  @Post()
  @Roles(['manager', 'nurse'])
  @ApiOperation({ summary: 'Cadastra um novo encaminhamento' })
  async create(
    @CurrentUser() currentUser: UserSchema,
    @Body() createReferralDto: CreateReferralDto,
  ): Promise<BaseResponseSchema> {
    await this.createReferralUseCase.execute({
      createReferralDto,
      userId: currentUser.id,
    });

    return { success: true, message: 'Encaminhamento cadastrado com sucesso.' };
  }

  @Patch(':id/cancel')
  @Roles(['nurse', 'manager'])
  @ApiOperation({ summary: 'Cancela um encaminhamento' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: UserSchema,
  ): Promise<BaseResponseSchema> {
    await this.cancelReferralUseCase.execute({ id, userId: user.id });

    return {
      success: true,
      message: 'Encaminhamento cancelado com sucesso.',
    };
  }
}
