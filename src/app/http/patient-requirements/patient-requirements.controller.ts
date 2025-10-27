import { Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponseSchema } from '@/domain/schemas/base';
import { UserSchema } from '@/domain/schemas/user';

import { PatientRequirementsService } from './patient-requirements.service';

@Controller('patients/requirements')
export class PatientRequirementsController {
  constructor(
    private readonly patientRequirementsService: PatientRequirementsService,
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
}
