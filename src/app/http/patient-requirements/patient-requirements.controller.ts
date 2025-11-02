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

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponseSchema } from '@/domain/schemas/base';
import { FindAllPatientsRequirementsByPatientIdResponseSchema } from '@/domain/schemas/patient-requirement';
import { UserSchema } from '@/domain/schemas/user';

import {
  CreatePatientRequirementDto,
  FindAllPatientsRequirementsByPatientIdDto,
} from './patient-requirements.dtos';
import { PatientRequirementsRepository } from './patient-requirements.repository';
import { PatientRequirementsService } from './patient-requirements.service';

@ApiTags('Pendências do paciente')
@Controller('patients/requirements')
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
    @CurrentUser() currentUser: UserSchema,
  ): Promise<BaseResponseSchema> {
    await this.patientRequirementsService.create(
      createPatientRequirementDto,
      currentUser.id,
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
    @CurrentUser() user: UserSchema,
  ): Promise<BaseResponseSchema> {
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
    @CurrentUser() currentUser: UserSchema,
  ): Promise<BaseResponseSchema> {
    await this.patientRequirementsService.decline(id, currentUser.id);

    return {
      success: true,
      message: 'Solicitação recusada com sucesso.',
    };
  }

  @Get(':id')
  @Roles(['nurse', 'manager'])
  @ApiOperation({
    summary: 'Lista todas as solicitações do paciente pelo ID.',
  })
  async findAllByPatientId(
    @Param('id') id: string,
    @Query() filters: FindAllPatientsRequirementsByPatientIdDto,
  ): Promise<FindAllPatientsRequirementsByPatientIdResponseSchema> {
    const { requirements, total } =
      await this.patientRequirementsRepository.findAllByPatientId(id, filters);

    return {
      success: true,
      message: 'Lista de solicitações do paciente retornada com sucesso.',
      data: { requirements, total },
    };
  }

  @Get('/me')
  @Roles(['patient'])
  @ApiOperation({ summary: 'Busca todas as solicitações do paciente logado.' })
  async findAllByPatientLogged(
    @CurrentUser() user: UserSchema,
    @Query() filters: FindAllPatientsRequirementsByPatientIdDto,
  ): Promise<FindAllPatientsRequirementsByPatientIdResponseSchema> {
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
