import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthUser } from '@/common/decorators/auth-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponse } from '@/common/dtos';

import type { AuthUserDto } from '../auth/auth.dtos';
import {
  CreateReferralDto,
  GetReferralsQuery,
  GetReferralsResponse,
} from './referrals.dtos';
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
  @ApiOperation({ summary: 'Lista todos os encaminhamentos' })
  @ApiResponse({ type: GetReferralsResponse })
  async getReferrals(
    @Query() query: GetReferralsQuery,
  ): Promise<GetReferralsResponse> {
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
  @ApiResponse({ type: BaseResponse })
  async create(
    @AuthUser() user: AuthUserDto,
    @Body() createReferralDto: CreateReferralDto,
  ): Promise<BaseResponse> {
    await this.createReferralUseCase.execute({
      userId: user.id,
      createReferralDto,
    });

    return { success: true, message: 'Encaminhamento cadastrado com sucesso.' };
  }

  @Patch(':id/cancel')
  @Roles(['nurse', 'manager'])
  @ApiOperation({ summary: 'Cancela o encaminhamento' })
  @ApiResponse({ type: BaseResponse })
  async cancel(
    @Param('id') id: string,
    @AuthUser() user: AuthUserDto,
  ): Promise<BaseResponse> {
    await this.cancelReferralUseCase.execute({ id, userId: user.id });

    return {
      success: true,
      message: 'Encaminhamento cancelado com sucesso.',
    };
  }
}
