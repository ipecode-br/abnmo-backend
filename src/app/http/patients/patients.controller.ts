import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Patient } from '@/domain/entities/patient';
import {
  CreatePatientResponseSchema,
  DeletePatientResponseSchema,
  FindAllPatientsResponseSchema,
  FindOnePatientResponseSchema,
} from '@/domain/schemas/patient';

import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientsService } from './patients.service';

@ApiTags('Pacientes')
@Controller('patients')
export class PatientsController {
  private readonly logger = new Logger(PatientsController.name);

  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo paciente' })
  @ApiResponse({
    status: 201,
    description: 'Paciente criado com sucesso',
    type: Patient,
  })
  @ApiResponse({
    status: 209,
    description: 'Paciente já cadastrado',
  })
  public async create(
    @Body() createPatientDto: CreatePatientDto,
  ): Promise<CreatePatientResponseSchema> {
    const patient = await this.patientsService.create(createPatientDto);

    this.logger.log(`Paciente criado com sucesso: ${JSON.stringify(patient)}`);

    return {
      success: true,
      message: 'Paciente criado com sucesso',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os pacientes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pacientes',
    type: [Patient],
  })
  public async findAll(): Promise<FindAllPatientsResponseSchema> {
    const patients = await this.patientsService.findAll();

    this.logger.log(
      `Lista de pacientes: ${patients.length} itens encontrados `,
    );
    return {
      success: true,
      message: 'Lista de pacientes retornada com sucesso!',
      data: patients,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um paciente pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Paciente encontrado',
    type: Patient,
  })
  @ApiResponse({ status: 404, description: 'Paciente não encontrado' })
  public async findById(
    @Param('id') id: string,
  ): Promise<FindOnePatientResponseSchema> {
    const patient = await this.patientsService.findById(id);

    this.logger.log(`Paciente encontrado: ${JSON.stringify(patient)}`);
    return {
      success: true,
      message: 'Paciente encontrado',
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
    const patient = await this.patientsService.remove(id);

    this.logger.log(
      `Paciente removido com sucesso: ${JSON.stringify(patient)}`,
    );
    return {
      success: true,
      message: '`Paciente removido com sucesso',
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
