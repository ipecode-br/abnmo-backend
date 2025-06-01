import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PatientSupport } from '@/domain/entities/patient-support';
import { EnvelopeDTO } from '@/utils/envelope.dto';
import { validateDto } from '@/utils/validate.dto';

import { CreatePatientSupportDto } from './dto/create-patient-support.dto';
import { PatientSupportsService } from './patient-supports.service';

@ApiTags('Apoios')
@Controller('patient-supports')
export class PatientSupportsController {
  private readonly logger = new Logger(PatientSupportsController.name);

  constructor(
    private readonly patientSupportsService: PatientSupportsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo apoio' })
  @ApiResponse({
    status: 201,
    description: 'Apoio criado com sucesso',
    type: PatientSupport,
  })
  @ApiResponse({
    status: 409,
    description: 'Apoio já cadastrado para esse paciente',
  })
  public async create(
    @Body() createPatientSupportDto: CreatePatientSupportDto,
  ): Promise<EnvelopeDTO<PatientSupport, null>> {
    try {
      await validateDto(createPatientSupportDto);

      const support = await this.patientSupportsService.create(
        createPatientSupportDto,
      );

      if (!support) {
        this.logger.error('Falha ao criar o apoio.');
        return {
          success: false,
          message: 'Erro ao criar apoio',
          data: undefined,
        };
      }

      this.logger.log(`Apoio criado com sucesso: ${JSON.stringify(support)}`);
      return {
        success: true,
        message: 'Apoio criado com sucesso',
        data: support,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao criar apoio: ${error instanceof Error ? error.message : 'Erro ao criar apoio'}`,
      );
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Erro interno ao criar apoio',
        data: undefined,
      };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os apoios' })
  @ApiResponse({
    status: 200,
    description: 'Lista de apoios',
    type: [PatientSupport],
  })
  public async findAll(): Promise<EnvelopeDTO<PatientSupport[], null>> {
    try {
      const supports = await this.patientSupportsService.findAll();
      if (!supports) {
        return {
          success: false,
          message: 'Erro ao buscar lista de apoios!',
          data: undefined,
        };
      }
      return {
        success: true,
        message: 'Lista de suportes retornada com sucesso!',
        data: supports,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Erro interno ao buscar lista de apoios!',
        data: undefined,
      };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um apoio pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Apoio encontrado',
    type: PatientSupport,
  })
  @ApiResponse({ status: 404, description: 'Apoio não encontrado' })
  public async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EnvelopeDTO<PatientSupport, null>> {
    try {
      const support = await this.patientSupportsService.findById(id);
      if (!support) {
        this.logger.log(`Apoio não encontrado`);
        return {
          success: false,
          message: 'Apoio não encontrado',
          data: undefined,
        };
      }
      return {
        success: true,
        message: 'Apoio  encontrado',
        data: support,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Erro ao buscar apoio',
        data: undefined,
      };
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um apoio pelo ID' })
  @ApiResponse({ status: 200, description: 'Apoio removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Apoio não encontrado' })
  public async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EnvelopeDTO<PatientSupport, null>> {
    try {
      const support = await this.patientSupportsService.remove(id);
      if (!support) {
        return {
          success: false,
          message: 'Apoio não encontrado',
          data: undefined,
        };
      }

      return {
        success: true,
        message: 'Apoio removido com sucesso!',
        data: support,
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Erro interno ao remover apoio!',
        data: undefined,
      };
    }
  }
}
