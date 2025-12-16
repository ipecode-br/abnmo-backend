import {
  Body,
  Controller,
  Get,
  NotFoundException,
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
} from '@/domain/schemas/patient/responses';
import type { GetPatientSupportsResponse } from '@/domain/schemas/patient-support/responses';

import type { AuthUserDto } from '../auth/auth.dtos';
import { PatientSupportsRepository } from '../patient-supports/patient-supports.repository';
import {
  GetPatientsQuery,
  PatientScreeningDto,
  UpdatePatientDto,
} from './patients.dtos';
import { PatientsRepository } from './patients.repository';
import { PatientsService } from './patients.service';

@ApiTags('Pacientes')
@Controller('patients')
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly patientsRepository: PatientsRepository,
    private readonly patientsSupportsRepository: PatientSupportsRepository,
  ) {}

  @Post('/screening')
  @Roles(['patient'])
  @ApiOperation({ summary: 'Registra triagem do paciente' })
  public async screening(
    @AuthUser() authUser: AuthUserDto,
    @Body() patientScreeningDto: PatientScreeningDto,
  ): Promise<BaseResponse> {
    await this.patientsService.screening(patientScreeningDto, authUser);

    return {
      success: true,
      message: 'Triagem realizada com sucesso.',
    };
  }

  @Post()
  @Roles(['manager', 'nurse'])
  @ApiOperation({ summary: 'Cadastra um novo paciente' })
  public async create(
    @Body() createPatientDto: PatientScreeningDto,
  ): Promise<BaseResponse> {
    await this.patientsService.create(createPatientDto);

    return {
      success: true,
      message: 'Cadastro realizado com sucesso.',
    };
  }

  @Get()
  @Roles(['manager', 'nurse'])
  @ApiOperation({ summary: 'Lista todos os pacientes' })
  public async findAll(
    @Query() filters: GetPatientsQuery,
  ): Promise<GetPatientsResponse> {
    const { patients, total } = await this.patientsRepository.findAll(filters);

    return {
      success: true,
      message: 'Lista de pacientes retornada com sucesso.',
      data: { patients, total },
    };
  }

  @Get(':id')
  @Roles(['manager', 'nurse', 'specialist'])
  @ApiOperation({ summary: 'Busca um paciente pelo ID' })
  public async findById(@Param('id') id: string): Promise<GetPatientResponse> {
    const patient = await this.patientsRepository.findById(id);

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    return {
      success: true,
      message: 'Paciente retornado com sucesso.',
      data: patient,
    };
  }

  @Put(':id')
  @Roles(['manager', 'nurse', 'patient'])
  @ApiOperation({ summary: 'Atualiza um paciente pelo ID' })
  async update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ): Promise<BaseResponse> {
    await this.patientsService.update(id, updatePatientDto);

    return {
      success: true,
      message: 'Paciente atualizado com sucesso.',
    };
  }

  @Patch(':id/inactivate')
  @Roles(['manager'])
  @ApiOperation({ summary: 'Inativa o Paciente pelo ID' })
  async inactivatePatient(@Param('id') id: string): Promise<BaseResponse> {
    await this.patientsService.deactivate(id);

    return {
      success: true,
      message: 'Paciente inativado com sucesso.',
    };
  }

  @Get(':id/patient-supports')
  @Roles(['manager', 'nurse', 'specialist', 'patient'])
  @ApiOperation({ summary: 'Lista todos os contatos de apoio de um paciente' })
  async findAllPatientSupports(
    @Param('id') patientId: string,
  ): Promise<GetPatientSupportsResponse> {
    const patient = await this.patientsRepository.findById(patientId);

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const patientSupports =
      await this.patientsSupportsRepository.findAllByPatientId(patientId);

    return {
      success: true,
      message: 'Lista de contatos de apoio retornada com sucesso.',
      data: {
        patient_supports: patientSupports,
        total: patientSupports.length,
      },
    };
  }
}
