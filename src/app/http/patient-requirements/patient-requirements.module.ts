import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Patient } from '@/domain/entities/patient';
import { PatientRequirement } from '@/domain/entities/patient-requirement';

import { PatientRequirementsController } from './patient-requirements.controller';
import { ApprovePatientRequirementUseCase } from './use-cases/approve-patient-requirement.use-case';
import { CreatePatientRequirementUseCase } from './use-cases/create-patient-requirement.use-case';
import { DeclinePatientRequirementUseCase } from './use-cases/decline-patient-requirement.use-case';
import { GetPatientRequirementsUseCase } from './use-cases/get-patient-requirements.use-case';
import { GetPatientRequirementsByPatientIdUseCase } from './use-cases/get-patient-requirements-by-patient-id.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, PatientRequirement])],
  controllers: [PatientRequirementsController],
  providers: [
    CreatePatientRequirementUseCase,
    ApprovePatientRequirementUseCase,
    DeclinePatientRequirementUseCase,
    GetPatientRequirementsUseCase,
    GetPatientRequirementsByPatientIdUseCase,
  ],
})
export class PatientRequirementsModule {}
