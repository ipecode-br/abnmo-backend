import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthUser } from '@/common/decorators/auth-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponse } from '@/domain/schemas/base';
import type {
  GetPatientRequirementsByPatientIdResponse,
  GetPatientRequirementsResponse,
} from '@/domain/schemas/patient-requirement/responses';

import type { AuthUserDto } from '../auth/auth.dtos';
import {
  CreatePatientRequirementDto,
  GetPatientRequirementsByPatientIdQuery,
  GetPatientRequirementsQuery,
} from './patient-requirements.dtos';
import { PatientRequirementsRepository } from './patient-requirements.repository';
import { PatientRequirementsService } from './patient-requirements.service';

@ApiTags('Pendências do paciente')
@Controller('patient-requirements')
export class PatientRequirementsController {
  constructor(
    private readonly patientRequirementsService: PatientRequirementsService,
    private readonly patientRequirementsRepository: PatientRequirementsRepository,
  ) {}

  @Post()
  @Roles(['nurse', 'manager'])
  @ApiOperation({ summary: 'Adiciona nova solicitação.' })
  public async create(
    @Body() createPatientRequirementDto: CreatePatientRequirementDto,
    @AuthUser() authUser: AuthUserDto,
  ): Promise<BaseResponse> {
    await this.patientRequirementsService.create(
      createPatientRequirementDto,
      authUser,
    );

    return {
      success: true,
      message: 'Solicitação adicionada com sucesso.',
    };
  }

  @Patch(':id/approve')
  @Roles(['nurse', 'manager'])
  @ApiOperation({ summary: 'Aprova uma solicitação por ID.' })
  async approve(
    @Param('id') id: string,
    @AuthUser() user: AuthUserDto,
  ): Promise<BaseResponse> {
    await this.patientRequirementsService.approve(id, user);

    return {
      success: true,
      message: 'Solicitação aprovada com sucesso.',
    };
  }

  @Patch(':id/decline')
  @Roles(['nurse', 'manager'])
  @ApiOperation({ summary: 'Recusa uma solicitação por ID.' })
  public async decline(
    @Param('id') id: string,
    @AuthUser() authUser: AuthUserDto,
  ): Promise<BaseResponse> {
    await this.patientRequirementsService.decline(id, authUser);

    return {
      success: true,
      message: 'Solicitação recusada com sucesso.',
    };
  }

  @Get()
  @Roles(['nurse', 'manager'])
  @ApiOperation({
    summary: 'Lista todas as solicitações de pacientes com paginação e filtros',
  })
  async findAll(
    @Query() filters: GetPatientRequirementsQuery,
  ): Promise<GetPatientRequirementsResponse> {
    const { requirements, total } =
      await this.patientRequirementsRepository.findAll(filters);

    return {
      success: true,
      message: 'Lista de solicitações retornada com sucesso',
      data: { requirements, total },
    };
  }

  @Get(':id')
  @Roles(['nurse', 'manager'])
  @ApiOperation({
    summary: 'Lista todas as solicitações do paciente pelo ID.',
  })
  async findAllByPatientId(
    @Param('id') id: string,
    @Query() filters: GetPatientRequirementsByPatientIdQuery,
  ): Promise<GetPatientRequirementsByPatientIdResponse> {
    const { requirements, total } =
      await this.patientRequirementsRepository.findAllByPatientId(id, filters);

    return {
      success: true,
      message: 'Lista de solicitações do paciente retornada com sucesso.',
      data: { requirements, total },
    };
  }

  @Get('/me')
  @ApiOperation({ summary: 'Busca todas as solicitações do paciente logado.' })
  async findAllByPatientLogged(
    @AuthUser() user: AuthUserDto,
    @Query() filters: GetPatientRequirementsByPatientIdQuery,
  ): Promise<GetPatientRequirementsByPatientIdResponse> {
    const { requirements, total } =
      await this.patientRequirementsRepository.findAllByPatientLogged(
        user.id,
        filters,
      );

    return {
      success: true,
      message: 'Lista de solicitações retornada com sucesso.',
      data: { requirements, total },
    };
  }
}
