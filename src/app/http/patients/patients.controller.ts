import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponseSchema } from '@/domain/schemas/base';
import {
  CreatePatientResponseSchema,
  DeletePatientResponseSchema,
  FindAllPatientsResponseSchema,
  FindOnePatientResponseSchema,
  InactivatePatientResponseSchema,
} from '@/domain/schemas/patient';
import { FindAllPatientsSupportResponseSchema } from '@/domain/schemas/patient-support';

import { PatientSupportsRepository } from '../patient-supports/patient-supports.repository';
import {
  CreatePatientDto,
  FindAllPatientQueryDto,
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

  @Post()
  @Roles(['manager', 'nurse'])
  @ApiOperation({
    summary: 'Cadastra um novo paciente',
    description: `
    Dois modos de operação:
    1. Com "user_id" existente: associa a um usuário já cadastrado (ignora os campos "email" e "name")
    2. Sem "user_id": cria novo usuário automaticamente ("email" e "name" são obrigatórios)
    `,
  })
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
  @Roles(['manager', 'nurse'])
  @ApiOperation({ summary: 'Lista todos os pacientes' })
  public async findAll(
    @Query() filters: FindAllPatientQueryDto,
  ): Promise<FindAllPatientsResponseSchema> {
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

  @Patch(':id/inactivate')
  @Roles(['manager', 'nurse'])
  @ApiOperation({ summary: 'Inativa o Paciente pelo ID' })
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
  @Roles(['manager', 'nurse', 'specialist', 'patient'])
  @ApiOperation({ summary: 'Lista todos os contatos de apoio de um paciente' })
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

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um paciente pelo ID' })
  public async remove(
    @Param('id') id: string,
  ): Promise<DeletePatientResponseSchema> {
    await this.patientsService.remove(id);

    return {
      success: true,
      message: 'Paciente removido com sucesso.',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um paciente pelo ID' })
  async update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ): Promise<BaseResponseSchema> {
    await this.patientsService.update(id, updatePatientDto);
    return {
      success: true,
      message: 'Paciente atualizado com sucesso.',
    };
  }
}
