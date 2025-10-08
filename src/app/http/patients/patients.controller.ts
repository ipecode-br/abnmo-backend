import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponseSchema } from '@/domain/schemas/base';
import {
  FindAllPatientsResponseSchema,
  GetPatientResponseSchema,
  PatientsPendingInfoResponseSchema,
} from '@/domain/schemas/patient';
import { FindAllPatientsSupportResponseSchema } from '@/domain/schemas/patient-support';
import type { UserSchema } from '@/domain/schemas/user';

import { PatientSupportsRepository } from '../patient-supports/patient-supports.repository';
import {
  CreatePatientDto,
  FindAllPatientQueryDto,
  PatientScreeningDto,
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

  @Post('/screening')
  @Roles(['patient'])
  @ApiOperation({ summary: 'Registra triagem do paciente' })
  public async screening(
    @CurrentUser() user: UserSchema,
    @Body() patientScreeningDto: PatientScreeningDto,
  ): Promise<BaseResponseSchema> {
    await this.patientsService.screening(patientScreeningDto, user);

    return {
      success: true,
      message: 'Triagem realizada com sucesso.',
    };
  }

  @Post()
  @Roles(['manager', 'nurse', 'patient'])
  @ApiOperation({ summary: 'Cadastra um novo paciente' })
  public async create(
    @Body() createPatientDto: CreatePatientDto,
  ): Promise<BaseResponseSchema> {
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

  @Get('pending-info')
  @Roles(['patient'])
  @ApiOperation({ summary: 'Obtém informações pendentes do paciente' })
  async getPendingInfo(
    @CurrentUser() user: UserSchema,
  ): Promise<PatientsPendingInfoResponseSchema> {
    const data = await this.patientsService.getPendingInfo(user);

    return {
      success: true,
      message: 'Informações pendentes retornadas com sucesso',
      data,
    };
  }

  @Get(':id')
  @Roles(['manager', 'nurse', 'specialist'])
  @ApiOperation({ summary: 'Busca um paciente pelo ID' })
  public async findById(
    @Param('id') id: string,
  ): Promise<GetPatientResponseSchema> {
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

  @Put(':id')
  @Roles(['manager', 'nurse', 'patient'])
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

  @Patch(':id/inactivate')
  @Roles(['manager'])
  @ApiOperation({ summary: 'Inativa o Paciente pelo ID' })
  async inactivatePatient(
    @Param('id') id: string,
  ): Promise<BaseResponseSchema> {
    await this.patientsService.deactivate(id);

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
}
