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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthUser } from '@/common/decorators/auth-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponse } from '@/common/dtos';

import type { AuthUserDto } from '../auth/auth.dtos';
import {
  CreateReferralDto,
  GetReferralsQuery,
  GetReferralsResponse,
  UpdateReferralDto,
} from './referrals.dtos';
import { CancelReferralUseCase } from './use-cases/cancel-referral.use-case';
import { CreateReferralUseCase } from './use-cases/create-referrals.use-case';
import { GetReferralsUseCase } from './use-cases/get-referrals.use-case';
import { UpdateReferralUseCase } from './use-cases/update-referral.use-case';

@ApiTags('Encaminhamentos')
@Controller('referrals')
export class ReferralsController {
  constructor(
    private readonly getReferralsUseCase: GetReferralsUseCase,
    private readonly createReferralUseCase: CreateReferralUseCase,
    private readonly updateReferralUseCase: UpdateReferralUseCase,
    private readonly cancelReferralUseCase: CancelReferralUseCase,
  ) {}

  @Get()
  @Roles(['manager', 'nurse', 'specialist', 'patient'])
  @ApiOperation({ summary: 'Lista todos os encaminhamentos' })
  @ApiResponse({ type: GetReferralsResponse })
  async getReferrals(
    @Query() query: GetReferralsQuery,
    @AuthUser() user: AuthUserDto,
  ): Promise<GetReferralsResponse> {
    const data = await this.getReferralsUseCase.execute({ user, ...query });

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
      createReferralDto,
      user,
    });

    return { success: true, message: 'Encaminhamento cadastrado com sucesso.' };
  }

  @Put(':id')
  @Roles(['nurse', 'manager', 'specialist'])
  @ApiOperation({ summary: 'Atualiza os dados do encaminhamento' })
  @ApiResponse({ type: BaseResponse })
  public async update(
    @Param('id') id: string,
    @AuthUser() user: AuthUserDto,
    @Body() updateReferralDto: UpdateReferralDto,
  ): Promise<BaseResponse> {
    await this.updateReferralUseCase.execute({
      id,
      user,
      updateReferralDto,
    });

    return {
      success: true,
      message: 'Encaminhamento atualizado com sucesso.',
    };
  }

  @Patch(':id/cancel')
  @Roles(['nurse', 'manager'])
  @ApiOperation({ summary: 'Cancela o encaminhamento' })
  @ApiResponse({ type: BaseResponse })
  async cancel(
    @Param('id') id: string,
    @AuthUser() user: AuthUserDto,
  ): Promise<BaseResponse> {
    await this.cancelReferralUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Encaminhamento cancelado com sucesso.',
    };
  }
}
