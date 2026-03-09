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

import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse } from '@/common/dtos';
import type { AuthUser } from '@/common/types';

import {
  CreatePatientRequirementDto,
  GetPatientRequirementsByPatientIdQuery,
  GetPatientRequirementsByPatientIdResponse,
  GetPatientRequirementsQuery,
  GetPatientRequirementsResponse,
} from './patient-requirements.dtos';
import { ApprovePatientRequirementUseCase } from './use-cases/approve-patient-requirement.use-case';
import { CreatePatientRequirementUseCase } from './use-cases/create-patient-requirement.use-case';
import { DeclinePatientRequirementUseCase } from './use-cases/decline-patient-requirement.use-case';
import { GetPatientRequirementsUseCase } from './use-cases/get-patient-requirements.use-case';
import { GetPatientRequirementsByPatientIdUseCase } from './use-cases/get-patient-requirements-by-patient-id.use-case';

@ApiTags('Pendências do paciente')
@Controller('patient-requirements')
export class PatientRequirementsController {
  constructor(
    private readonly createPatientRequirementUseCase: CreatePatientRequirementUseCase,
    private readonly approvePatientRequirementUseCase: ApprovePatientRequirementUseCase,
    private readonly declinePatientRequirementUseCase: DeclinePatientRequirementUseCase,
    private readonly getPatientRequirementsUseCase: GetPatientRequirementsUseCase,
    private readonly getPatientRequirementsByPatientIdUseCase: GetPatientRequirementsByPatientIdUseCase,
  ) {}

  @Get()
  @Roles(['nurse', 'manager'])
  @ApiOperation({ summary: 'Lista todas as solicitações' })
  @ApiResponse({ type: GetPatientRequirementsResponse })
  async getPatientRequirements(
    @Query() query: GetPatientRequirementsQuery,
  ): Promise<GetPatientRequirementsResponse> {
    const data = await this.getPatientRequirementsUseCase.execute(query);

    return {
      success: true,
      message: 'Lista de solicitações retornada com sucesso',
      data,
    };
  }

  @Get('me')
  @ApiOperation({
    summary: 'Lista todas as solicitações do paciente autenticado',
  })
  @ApiResponse({ type: GetPatientRequirementsByPatientIdResponse })
  async getPatientRequirementsLogged(
    @User() user: AuthUser,
    @Query() query: GetPatientRequirementsByPatientIdQuery,
  ): Promise<GetPatientRequirementsByPatientIdResponse> {
    const data = await this.getPatientRequirementsByPatientIdUseCase.execute({
      patientId: user.id,
      ...query,
    });

    return {
      success: true,
      message: 'Lista de solicitações retornada com sucesso.',
      data,
    };
  }

  @Post()
  @Roles(['nurse', 'manager'])
  @ApiOperation({ summary: 'Cadastra uma nova solicitação' })
  @ApiResponse({ type: BaseResponse })
  async create(
    @User() user: AuthUser,
    @Body() createPatientRequirementDto: CreatePatientRequirementDto,
  ): Promise<BaseResponse> {
    await this.createPatientRequirementUseCase.execute({
      user,
      ...createPatientRequirementDto,
    });

    return {
      success: true,
      message: 'Solicitação cadastrada com sucesso.',
    };
  }

  @Patch(':id/approve')
  @Roles(['nurse', 'manager'])
  @ApiOperation({ summary: 'Aprova a solicitação' })
  @ApiResponse({ type: BaseResponse })
  async approve(
    @Param('id') id: string,
    @User() user: AuthUser,
  ): Promise<BaseResponse> {
    await this.approvePatientRequirementUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Solicitação aprovada com sucesso.',
    };
  }

  @Patch(':id/decline')
  @Roles(['nurse', 'manager'])
  @ApiOperation({ summary: 'Recusa a solicitação' })
  @ApiResponse({ type: BaseResponse })
  async decline(
    @Param('id') id: string,
    @User() user: AuthUser,
  ): Promise<BaseResponse> {
    await this.declinePatientRequirementUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Solicitação recusada com sucesso.',
    };
  }
}
