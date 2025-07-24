import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  CreatePatientResponseSchema,
  DeletePatientResponseSchema,
  FindAllPatientsResponseSchema,
  FindOnePatientResponseSchema,
  InactivatePatientResponseSchema,
} from '@/domain/schemas/patient';
import { FindAllPatientsSupportResponseSchema } from '@/domain/schemas/patient-support';

import { PatientSupportsRepository } from '../patient-supports/patient-supports.repository';
import { CreatePatientDto, FindAllPatientDto } from './patients.dtos';
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

  @Post()
  @ApiOperation({ summary: 'Cadastra um novo paciente' })
  public async create(
    @Body() createPatientDto: CreatePatientDto,
  ): Promise<CreatePatientResponseSchema> {
    await this.patientsService.create(createPatientDto);

    return {
      success: true,
      message: 'Cadastro realizado com sucesso.',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os pacientes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pacientes retornada com sucesso',
  })
  public async findAll(
    @Query()
    filters: FindAllPatientDto,
  ): Promise<FindAllPatientsResponseSchema> {
    const patients = await this.patientsRepository.findAll(filters);

    return {
      success: true,
      message: 'Lista de pacientes retornada com sucesso.',
      data: { patients, total: patients.length },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um paciente pelo ID' })
  @ApiResponse({ status: 200, description: 'Paciente retornado com sucesso' })
  @ApiResponse({ status: 404, description: 'Paciente não encontrado' })
  public async findById(
    @Param('id') id: string,
  ): Promise<FindOnePatientResponseSchema> {
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

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um paciente pelo ID' })
  @ApiResponse({ status: 200, description: 'Paciente removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Paciente não encontrado' })
  public async remove(
    @Param('id') id: string,
  ): Promise<DeletePatientResponseSchema> {
    await this.patientsService.remove(id);

    return {
      success: true,
      message: 'Paciente removido com sucesso.',
    };
  }

  @Get('forms/status')
  @ApiOperation({ summary: 'Lista formulários pendentes por paciente' })
  @ApiResponse({
    status: 200,
    description: 'Lista de formulários pendentes por paciente',
  })
  public async getFormsStatus() {
    try {
      const formsStatus = await this.patientsService.getPatientFormsStatus();
      const pendingCount = formsStatus.reduce(
        (total, patient) => total + patient.pendingForms.length,
        0,
      );
      return {
        success: true,
        message: `${pendingCount} formulário(s) pendente(s) no total`,
        data: formsStatus,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Erro ao verificar formulários pendentes',
        data: [],
      };
    }
  }

  @Patch(':id/inactivate')
  @ApiOperation({ summary: 'Inativa o Paciente pelo ID' })
  @ApiResponse({ status: 200, description: 'Paciente inativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Paciente não encontrado' })
  @ApiResponse({ status: 409, description: 'Paciente já está inativo' })
  async inactivatePatient(
    @Param('id') id: string,
  ): Promise<InactivatePatientResponseSchema> {
    await this.patientsService.deactivatePatient(id);

    return {
      success: true,
      message: 'Paciente inativado com sucesso.',
    };
  }

  @Get(':id/patient-supports')
  @ApiOperation({ summary: 'Lista todos os contatos de apoio de um paciente' })
  @ApiResponse({
    status: 200,
    description: 'Lista de contatos de apoio retornada com sucesso',
  })
  async findAllPatientSupports(
    @Param('id') patientId: string,
  ): Promise<FindAllPatientsSupportResponseSchema> {
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
