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
import { ZodResponse } from 'nestjs-zod';

import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse } from '@/common/dtos';
import { Log } from '@/common/log/log.decorator';
import type { RequestUser } from '@/common/types';

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
@Roles(['member', 'specialist'])
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
  @ApiOperation({ summary: 'Lista todas as solicitações' })
  @ZodResponse({ type: GetPatientRequirementsResponse, status: 200 })
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
  @ZodResponse({ type: GetPatientRequirementsByPatientIdResponse, status: 200 })
  async getPatientRequirementsLogged(
    @User() user: RequestUser,
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
  @Log('create_patient_requirement')
  @ApiOperation({ summary: 'Cadastra uma nova solicitação' })
  @ZodResponse({ type: BaseResponse, status: 201 })
  async create(
    @User() user: RequestUser,
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
  @Log('approve_patient_requirement')
  @ApiOperation({ summary: 'Aprova a solicitação' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async approve(
    @Param('id') id: string,
    @User() user: RequestUser,
  ): Promise<BaseResponse> {
    await this.approvePatientRequirementUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Solicitação aprovada com sucesso.',
    };
  }

  @Patch(':id/decline')
  @Log('decline_patient_requirement')
  @ApiOperation({ summary: 'Recusa a solicitação' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async decline(
    @Param('id') id: string,
    @User() user: RequestUser,
  ): Promise<BaseResponse> {
    await this.declinePatientRequirementUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Solicitação recusada com sucesso.',
    };
  }
}
