import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PatientSupport } from '@/domain/entities/patient-support';

import { CreatePatientSupportDto } from './dto/create-patient-support.dto';
import { PatientSupportsService } from './patient-supports.service';

@ApiTags('Apoios')
@Controller('patients/:patientId/patient-supports')
export class PatientSupportsController {
  private readonly logger = new Logger(PatientSupportsController.name);

  constructor(
    private readonly patientSupportsService: PatientSupportsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo apoio para um paciente' })
  @ApiResponse({
    status: 201,
    description: 'Apoio criado com sucesso.',
    type: PatientSupport,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Apoio já cadastrado para esse paciente',
  })
  async create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() createDto: CreatePatientSupportDto,
  ): Promise<PatientSupport> {
    return this.patientSupportsService.create(patientId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os apoios de um paciente' })
  @ApiResponse({
    status: 200,
    description: 'Lista de apoios retornada com sucesso.',
    type: [PatientSupport],
  })
  async findAll(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<PatientSupport[]> {
    return this.patientSupportsService.findAllByPatient(patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um apoio pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Apoio encontrado.',
    type: PatientSupport,
  })
  @ApiResponse({ status: 404, description: 'Apoio não encontrado' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PatientSupport> {
    return this.patientSupportsService.findById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um apoio pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Apoio removido com sucesso.',
    type: PatientSupport,
  })
  @ApiResponse({ status: 404, description: 'Apoio não encontrado' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PatientSupport> {
    return this.patientSupportsService.remove(id);
  }
}
