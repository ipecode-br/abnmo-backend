import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponseSchema } from '@/domain/schemas/base';
import { FindAllPatientsRequirementsResponseSchema } from '@/domain/schemas/patient-requirement';
import { UserSchema } from '@/domain/schemas/user';

import { FindAllPatientsRequirementsByIdDto } from './patient-requirement.dto';
import { PatientRequirementsRepository } from './patient-requirements.repository';
import { PatientRequirementsService } from './patient-requirements.service';

@Controller('patients/requirements')
export class PatientRequirementsController {
  constructor(
    private readonly patientRequirementsService: PatientRequirementsService,
    private readonly patientRequirementsRepository: PatientRequirementsRepository,
  ) {}

  @Patch('/:id/approve')
  @Roles(['nurse', 'manager'])
  @ApiOperation({ summary: 'Aprova uma solicitação por ID' })
  async approvedPatientRequirement(
    @Param('id') id: string,
    @CurrentUser() user: UserSchema,
  ): Promise<BaseResponseSchema> {
    await this.patientRequirementsService.approveRequirement(id, user);

    return {
      success: true,
      message: 'Solicitação aprovada com sucesso.',
    };
  }

  @Get('/logged')
  @Roles(['patient'])
  @ApiOperation({ summary: 'Busca todas as solicitações do paciente logado' })
  async findAllPatientLogged(
    @CurrentUser() user: UserSchema,
    @Query() filters: FindAllPatientsRequirementsByIdDto,
  ): Promise<FindAllPatientsRequirementsResponseSchema> {
    const { requests, total } =
      await this.patientRequirementsRepository.findAllPatientLogged(
        user,
        filters,
      );

    return {
      success: true,
      message: 'Solicitação aprovada com sucesso.',
      data: { requests, total },
    };
  }
}
