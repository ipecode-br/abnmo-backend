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

import {
  CreatePatientSupportResponseSchema,
  DeletePatientSupportResponseSchema,
  FindAllPatientsSupportResponseSchema,
  FindOnePatientsSupportResponseSchema,
} from '@/domain/schemas/patient-support';

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
  @ApiOperation({ summary: 'Lista todos os apoios de um paciente' })
  @ApiResponse({
    status: 200,
    description: 'Lista de apoios retornada com sucesso.',
  })
  async findAll(
    @Param('patientId') patientId: string,
  ): Promise<FindAllPatientsSupportResponseSchema> {
    const supportsList = await this.findAll(patientId);

    this.logger.log(
      `Lista de apoios buscada para o paciente ${patientId}: ${supportsList.data.length} items encontrados`,
    );

    return {
      success: true,
      message: `Lista de Apoio retornada com sucesso`,
      data: supportsList.data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um apoio pelo ID' })
  @ApiResponse({ status: 200, description: 'Apoio encontrado.' })
  @ApiResponse({ status: 400, description: 'ID inválido.' })
  @ApiResponse({ status: 404, description: 'Apoio não encontrado.' })
  async findById(
    @Param('id') id: string,
  ): Promise<FindOnePatientsSupportResponseSchema> {
    const support = await this.findById(id);

    this.logger.log(
      `Apoio buscado com sucesso: ${JSON.stringify({
        id: support.data.id,
        patientID: support.data.patient_id,
        timestamp: new Date(),
      })}`,
    );

    return {
      success: true,
      message: `Apoio retornado com sucesso.`,
      data: support.data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um apoio pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Apoio removido com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Apoio não encontrado' })
  @ApiResponse({ status: 400, description: 'ID inválido.' })
  async remove(
    @Param('id') id: string,
  ): Promise<DeletePatientSupportResponseSchema> {
    const supportDelete = await this.patientSupportsService.remove(id);

    this.logger.log(
      `Apoio removido com sucesso: ${JSON.stringify({
        id: supportDelete.id,
        patientId: supportDelete.patient_id,
        timestamp: new Date(),
      })}`,
    );

    return {
      success: true,
      message: `Apoio retornado com sucesso`,
    };
  }
}
