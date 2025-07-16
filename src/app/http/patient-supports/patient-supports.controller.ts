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
  CreatePatientSupportResponseSchema,
  DeletePatientSupportResponseSchema,
  FindAllPatientsSupportResponseSchema,
  FindOnePatientsSupportResponseSchema,
} from '@/domain/schemas/patient-support';

import { CreatePatientSupportDto } from './patient-supports.dtos';
import { PatientSupportsRepository } from './patient-supports.repository';
import { PatientSupportsService } from './patient-supports.service';

@ApiTags('Rede de apoio')
@Controller('patients/:patientId/patient-supports')
export class PatientSupportsController {
  constructor(
    private readonly patientSupportsService: PatientSupportsService,
    private readonly patientSupportsRepository: PatientSupportsRepository,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Registra um novo contato de apoio para um paciente',
  })
  @ApiResponse({ status: 201, description: 'Apoio criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(
    @Param('patientId') patientId: string,
    @Body() createPatientSupportDto: CreatePatientSupportDto,
  ): Promise<CreatePatientSupportResponseSchema> {
    await this.patientSupportsService.create(
      patientId,
      createPatientSupportDto,
    );

    return {
      success: true,
      message: 'Contato de apoio registrado com sucesso.',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os contatos de apoio de um paciente' })
  @ApiResponse({
    status: 200,
    description: 'Lista de contatos de apoio retornada com sucesso',
  })
  async findAll(
    @Param('patientId') patientId: string,
  ): Promise<FindAllPatientsSupportResponseSchema> {
    const patientSupports =
      await this.patientSupportsService.findAllByPatientId(patientId);

    return {
      success: true,
      message: 'Lista de contatos de apoio retornada com sucesso.',
      data: {
        patient_supports: patientSupports,
        total: patientSupports.length,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um contato de apoio pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Contato de apoio retornado com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'ID inválido.' })
  @ApiResponse({ status: 404, description: 'Contato de apoio não encontrado.' })
  async findById(
    @Param('id') id: string,
  ): Promise<FindOnePatientsSupportResponseSchema> {
    const patientSupport = await this.patientSupportsRepository.findById(id);

    if (!patientSupport) {
      throw new NotFoundException('Contato de apoio não encontrado.');
    }

    return {
      success: true,
      message: 'Contato de apoio retornado com sucesso.',
      data: patientSupport,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um contato de apoio pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Contato de apoio removido com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Contato de apoio não encontrado' })
  async remove(
    @Param('id') id: string,
  ): Promise<DeletePatientSupportResponseSchema> {
    await this.patientSupportsService.remove(id);

    return {
      success: true,
      message: 'Contato de apoio removido com sucesso.',
    };
  }
}
