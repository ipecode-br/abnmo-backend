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

import { AuthUser } from '@/common/decorators/auth-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponse } from '@/domain/schemas/base';
import type {
  GetPatientResponse,
  GetPatientsResponse,
} from '@/domain/schemas/patients/responses';

import type { AuthUserDto } from '../auth/auth.dtos';
import {
  CreatePatientDto,
  GetPatientsQuery,
  UpdatePatientDto,
} from './patients.dtos';
import { CreatePatientUseCase } from './use-cases/create-patient.use-case';
import { DeactivatePatientUseCase } from './use-cases/deactivate-patient.use-case';
import { GetPatientUseCase } from './use-cases/get-patient.use-case';
import { GetPatientsUseCase } from './use-cases/get-patients.use-case';
import { UpdatePatientUseCase } from './use-cases/update-patient.use-case';

@ApiTags('Pacientes')
@Controller('patients')
export class PatientsController {
  constructor(
    private readonly getPatientsUseCase: GetPatientsUseCase,
    private readonly getPatientUseCase: GetPatientUseCase,
    private readonly createPatientUseCase: CreatePatientUseCase,
    private readonly updatePatientUseCase: UpdatePatientUseCase,
    private readonly deactivatePatientUseCase: DeactivatePatientUseCase,
  ) {}

  @Get()
  @Roles(['manager', 'nurse'])
  @ApiOperation({ summary: 'Lista todos os pacientes' })
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

  @Get(':id')
  @Roles(['manager', 'nurse', 'specialist'])
  @ApiOperation({ summary: 'Busca um paciente pelo ID' })
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
  @ApiOperation({ summary: 'Atualiza um paciente pelo ID' })
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
  @ApiOperation({ summary: 'Inativa um paciente pelo ID' })
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
