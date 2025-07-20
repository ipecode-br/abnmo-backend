import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  CreatePatientSupportResponseSchema,
  DeletePatientSupportResponseSchema,
  FindOnePatientsSupportResponseSchema,
  UpdatePatientSupportResponseSchema,
} from '@/domain/schemas/patient-support';

import { CreatePatientSupportDto } from '../patient-supports/patient-supports.dtos';
import { UpdatePatientSupportDto } from './patient-supports.dtos';
import { PatientSupportsRepository } from './patient-supports.repository';
import { PatientSupportsService } from './patient-supports.service';

@ApiTags('Rede de apoio')
@Controller('patient-supports')
export class PatientSupportsController {
  constructor(
    private readonly patientSupportsService: PatientSupportsService,
    private readonly patientSupportsRepository: PatientSupportsRepository,
  ) {}

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

  @Post(':id')
  @ApiOperation({
    summary: 'Registra um novo contato de apoio para um paciente',
  })
  @ApiResponse({ status: 201, description: 'Apoio criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createPatientSupport(
    @Param('id') support_id: string,
    @Body() createPatientSupportDto: CreatePatientSupportDto,
  ): Promise<CreatePatientSupportResponseSchema> {
    await this.patientSupportsService.create(
      createPatientSupportDto,
      support_id,
    );

    return {
      success: true,
      message: 'Contato de apoio registrado com sucesso.',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um contato de apoio por ID' })
  @ApiResponse({
    status: 200,
    description: 'Contato de apoio atualizado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'ID inválido.' })
  @ApiResponse({ status: 404, description: 'Contato de apoio não encontrado.' })
  async updatePatientSupport(
    @Param('id') id: string,
    @Body() updatePatientSupportDto: UpdatePatientSupportDto,
  ): Promise<UpdatePatientSupportResponseSchema> {
    await this.patientSupportsService.update(id, updatePatientSupportDto);

    return {
      success: true,
      message: 'Contato de apoio atualizado com sucesso.',
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
