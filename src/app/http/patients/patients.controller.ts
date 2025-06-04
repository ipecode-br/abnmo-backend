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

import { Patient } from '@/domain/entities/patient';
import { EnvelopeDTO } from '@/utils/envelope.dto';
import { validateDto } from '@/utils/validate.dto';

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
  ): Promise<EnvelopeDTO<Patient, null>> {
    try {
      await validateDto(createPatientDto);

      const patient = await this.patientsService.create(createPatientDto);
      if (!patient) {
        return {
          success: false,
          message: 'Erro ao criar paciente',
          data: undefined,
        };
      }
      this.logger.log(
        `Paciente criado com sucesso: ${JSON.stringify(patient)}`,
      );
      return {
        success: true,
        message: 'Paciente criado com sucesso',
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Erro interno ao criar paciente',
        data: undefined,
      };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os pacientes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pacientes',
    type: [Patient],
  })
  public async findAll(): Promise<EnvelopeDTO<Patient[], null>> {
    try {
      const patients = await this.patientsService.findAll();
      if (!patients) {
        return {
          success: false,
          message: 'Erro ao listas todos os pacientes!',
          data: undefined,
        };
      }
      return {
        success: true,
        message: 'Lista de pacientes retornada com sucesso!',
        data: patients,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Erro interno ao listas todos os pacientes!',
        data: undefined,
      };
    }
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
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EnvelopeDTO<Patient, null>> {
    try {
      const patient = await this.patientsService.findById(id);
      if (!patient) {
        return {
          success: false,
          message: 'Erro ao encontrar paciente!',
          data: undefined,
        };
      }
      this.logger.log(`Paciente encontrado`);
      return {
        success: true,
        message: 'Paciente encontrado',
        data: patient,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Erro interno ao encontrar paciente!',
        data: undefined,
      };
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um paciente pelo ID' })
  @ApiResponse({ status: 200, description: 'Paciente removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Paciente não encontrado' })
  public async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EnvelopeDTO<Patient, null>> {
    try {
      const patient = await this.patientsService.remove(id);
      if (!patient) {
        return {
          success: false,
          message: 'Erro ao remover paciente!',
          data: undefined,
        };
      }

      this.logger.log(
        `Paciente removido com sucesso: ${JSON.stringify(patient)}`,
      );
      return {
        success: true,
        message: '`Paciente removido com sucesso',
        data: patient,
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Erro interno ao remover paciente!',
        data: undefined,
      };
    }
  }

  @Get('forms/status')
  @ApiOperation({ summary: 'Obtém todos os formulários separados por status' })
  @ApiResponse({
    status: 200,
    description: 'Formulários separados por status de preenchimento',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            completeForms: {
              type: 'array',
              items: { $ref: '#/components/schemas/Patient' },
            },
            pendingForms: {
              type: 'array',
              items: { $ref: '#/components/schemas/Patient' },
            },
          },
        },
      },
    },
  })
  public async getFormsStatus(): Promise<
    EnvelopeDTO<
      {
        completeForms: Patient[];
        pendingForms: Patient[];
      },
      null
    >
  > {
    try {
      const { completeForms, pendingForms } =
        await this.patientsService.getFormsStatus();

      return {
        success: true,
        message: 'Status dos formulários obtidos com sucesso',
        data: {
          completeForms,
          pendingForms,
        },
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Erro ao verificar status dos formulários',
        data: undefined,
      };
    }
  }
}
