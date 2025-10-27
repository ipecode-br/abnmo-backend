import { Module } from '@nestjs/common';

import { PatientRequirementsController } from './patient-requirements.controller';
import { PatientRequirementsService } from './patient-requirements.service';

@Module({
  controllers: [PatientRequirementsController],
  providers: [PatientRequirementsService],
})
export class PatientRequirementsModule {}
