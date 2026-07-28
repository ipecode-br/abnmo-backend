import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { RequireFeature } from '@/common/decorators/require-feature.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse, UUIDParam } from '@/common/dtos';
import { Log } from '@/common/log/log.decorator';
import type { RequestUser } from '@/common/types';

import {
  GetPatientOptionsResponse,
  GetPatientResponse,
  GetPatientsQuery,
  GetPatientsResponse,
  UpdatePatientBody,
} from './patients.dtos';
import { DeactivatePatientUseCase } from './use-cases/deactivate-patient.use-case';
import { GetPatientUseCase } from './use-cases/get-patient.use-case';
import { GetPatientOptionsUseCase } from './use-cases/get-patient-options.use-case';
import { GetPatientsUseCase } from './use-cases/get-patients.use-case';
import { UpdatePatientUseCase } from './use-cases/update-patient.use-case';

@ApiTags('Pacientes')
@Controller('patients')
export class PatientsController {
  constructor(
    private readonly deactivatePatientUseCase: DeactivatePatientUseCase,
    private readonly getPatientOptionsUseCase: GetPatientOptionsUseCase,
    private readonly getPatientUseCase: GetPatientUseCase,
    private readonly getPatientsUseCase: GetPatientsUseCase,
    private readonly updatePatientUseCase: UpdatePatientUseCase,
  ) {}

  @Get()
  @RequireFeature('read:patient:others')
  @ApiOperation({ summary: 'Lista todos os pacientes' })
  @ZodResponse({ type: GetPatientsResponse, status: 200 })
  async getPatients(
    @Query() query: GetPatientsQuery,
    @User() user: RequestUser,
  ): Promise<GetPatientsResponse> {
    const data = await this.getPatientsUseCase.execute({ ...query, user });

    return {
      success: true,
      message: 'Lista de pacientes retornada com sucesso.',
      data,
    };
  }

  @Get('options')
  @RequireFeature('read:patient:others')
  @ApiOperation({
    summary: 'Retorna uma lista de opções com todos os pacientes ativos',
  })
  @ZodResponse({ type: GetPatientOptionsResponse, status: 200 })
  async getPatientOptions(
    @User() user: RequestUser,
  ): Promise<GetPatientOptionsResponse> {
    const data = await this.getPatientOptionsUseCase.execute({ user });

    return {
      success: true,
      message: 'Lista de opções de pacientes retornada com sucesso.',
      data,
    };
  }

  @Get(':id')
  @RequireFeature(['read:patient', 'read:patient:others'])
  @ApiOperation({ summary: 'Retorna os dados do paciente' })
  @ZodResponse({ type: GetPatientResponse, status: 200 })
  async getPatientById(
    @Param() { id }: UUIDParam,
    @User() user: RequestUser,
  ): Promise<GetPatientResponse> {
    const data = await this.getPatientUseCase.execute({ user, id });

    return {
      success: true,
      message: 'Paciente retornado com sucesso.',
      data,
    };
  }

  @Put(':id')
  @Log('update_patient')
  @RequireFeature(['update:patient', 'update:patient:others'])
  @ApiOperation({ summary: 'Atualiza os dados do paciente' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async update(
    @Param() { id }: UUIDParam,
    @User() user: RequestUser,
    @Body() body: UpdatePatientBody,
  ): Promise<BaseResponse> {
    await this.updatePatientUseCase.execute({ id, user, ...body });

    return {
      success: true,
      message: 'Paciente atualizado com sucesso.',
    };
  }

  @Patch(':id/deactivate')
  @Log('deactivate_patient')
  @RequireFeature('deactivate:patient')
  @ApiOperation({ summary: 'Inativa o paciente' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async deactivatePatient(
    @Param() { id }: UUIDParam,
    @User() user: RequestUser,
  ): Promise<BaseResponse> {
    await this.deactivatePatientUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Paciente inativado com sucesso.',
    };
  }
}
