import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponseSchema } from '@/domain/schemas/base';
import { UserSchema } from '@/domain/schemas/user';

import { CreatePatientRequirementDto } from './patient-requirement.dto';
import { PatientRequirementsService } from './patient-requirements.service';

@Controller('patients/requirements')
export class PatientRequirementsController {
  constructor(
    private readonly patientRequirementsService: PatientRequirementsService,
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
