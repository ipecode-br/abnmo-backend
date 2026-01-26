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
  CreatePatientDto,
  GetPatientOptionsResponse,
  GetPatientResponse,
  GetPatientsQuery,
  GetPatientsResponse,
  UpdatePatientDto,
} from './patients.dtos';
import { CreatePatientUseCase } from './use-cases/create-patient.use-case';
import { DeactivatePatientUseCase } from './use-cases/deactivate-patient.use-case';
import { GetPatientUseCase } from './use-cases/get-patient.use-case';
import { GetPatientOptionsUseCase } from './use-cases/get-patient-options.use-case';
import { GetPatientsUseCase } from './use-cases/get-patients.use-case';
import { UpdatePatientUseCase } from './use-cases/update-patient.use-case';

@ApiTags('Pacientes')
@Controller('patients')
export class PatientsController {
  constructor(
    private readonly getPatientsUseCase: GetPatientsUseCase,
    private readonly getPatientUseCase: GetPatientUseCase,
    private readonly getPatientOptionsUseCase: GetPatientOptionsUseCase,
    private readonly createPatientUseCase: CreatePatientUseCase,
    private readonly updatePatientUseCase: UpdatePatientUseCase,
    private readonly deactivatePatientUseCase: DeactivatePatientUseCase,
  ) {}

  @Get()
  @Roles(['manager', 'nurse'])
  @ApiOperation({ summary: 'Lista todos os pacientes' })
  @ApiResponse({ type: GetPatientsResponse })
  async getPatients(
    @Query() query: GetPatientsQuery,
  ): Promise<GetPatientsResponse> {
    const data = await this.getPatientsUseCase.execute({ query });

    return {
      success: true,
      message: 'Lista de pacientes retornada com sucesso.',
      data,
    };
  }

  @Get('/options')
  @Roles(['manager', 'nurse'])
  @ApiOperation({
    summary: 'Retorna uma lista de opções com todos os pacientes ativos',
  })
  @ApiResponse({ type: GetPatientOptionsResponse })
  async getPatientOptions(): Promise<GetPatientOptionsResponse> {
    const data = await this.getPatientOptionsUseCase.execute();

    return {
      success: true,
      message: 'Lista de opções de pacientes retornada com sucesso.',
      data,
    };
  }

  @Get(':id')
  @Roles(['manager', 'nurse', 'specialist'])
  @ApiOperation({ summary: 'Retorna os dados do paciente' })
  @ApiResponse({ type: GetPatientResponse })
  async getPatientById(@Param('id') id: string): Promise<GetPatientResponse> {
    const { patient } = await this.getPatientUseCase.execute({ id });

    return {
      success: true,
      message: 'Paciente retornado com sucesso.',
      data: patient,
    };
  }

  @Post()
  @Roles(['manager', 'nurse'])
  @ApiOperation({ summary: 'Cadastra um novo paciente' })
  @ApiResponse({ type: BaseResponse })
  async create(
    @AuthUser() user: AuthUserDto,
    @Body() createPatientDto: CreatePatientDto,
  ): Promise<BaseResponse> {
    await this.createPatientUseCase.execute({ user, createPatientDto });

    return {
      success: true,
      message: 'Paciente registrado com sucesso.',
    };
  }

  @Put(':id')
  @Roles(['manager', 'nurse', 'patient'])
  @ApiOperation({ summary: 'Atualiza os dados do paciente' })
  @ApiResponse({ type: BaseResponse })
  async update(
    @Param('id') id: string,
    @AuthUser() user: AuthUserDto,
    @Body() updatePatientDto: UpdatePatientDto,
  ): Promise<BaseResponse> {
    await this.updatePatientUseCase.execute({ id, user, updatePatientDto });

    return {
      success: true,
      message: 'Paciente atualizado com sucesso.',
    };
  }

  @Patch(':id/deactivate')
  @Roles(['manager'])
  @ApiOperation({ summary: 'Inativa o paciente' })
  @ApiResponse({ type: BaseResponse })
  async deactivatePatient(
    @Param('id') id: string,
    @AuthUser() user: AuthUserDto,
  ): Promise<BaseResponse> {
    await this.deactivatePatientUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Paciente inativado com sucesso.',
    };
  }
}
