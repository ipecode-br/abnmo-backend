import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  CreatePatientResponseSchema,
  DeletePatientResponseSchema,
  FindAllPatientsResponseSchema,
  FindOnePatientResponseSchema,
} from '@/domain/schemas/patient';

import { CreatePatientDto } from './patients.dtos';
import { PatientsRepository } from './patients.repository';
import { PatientsService } from './patients.service';

@ApiTags('Pacientes')
@Controller('patients')
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly patientsRepository: PatientsRepository,
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
  public async findAll(): Promise<FindAllPatientsResponseSchema> {
    const patients = await this.patientsRepository.findAll();

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
}
