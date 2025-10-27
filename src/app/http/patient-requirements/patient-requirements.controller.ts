import { Controller } from '@nestjs/common';

import { PatientRequirementsService } from './patient-requirements.service';

@Controller('patient-requirements')
export class PatientRequirementsController {
  constructor(
    private readonly patientRequirementsService: PatientRequirementsService,
  ) {}
}
