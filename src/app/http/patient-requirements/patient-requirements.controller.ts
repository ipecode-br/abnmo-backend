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

  @Get(':id')
  @Roles(['nurse', 'manager'])
  @ApiOperation({
    summary: 'Lista todas as solicitações do paciente pelo seu id.',
  })
  async findAllById(
    @Param('id') id: string,
    @Query() filters: FindAllPatientsRequirementsByIdDto,
  ): Promise<FindAllPatientsRequirementsResponseSchema> {
    const { requests, total } =
      await this.patientRequirementsRepository.findAllById(id, filters);

    return {
      success: true,
      message: 'Lista de solicitações pelo id retornada com sucesso.',
      data: { requests, total },
    };
  }

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
}
