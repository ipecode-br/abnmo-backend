import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CryptographyModule } from '@/app/cryptography/cryptography.module';
import { PatientRequirement } from '@/domain/entities/patient-requirement';

import { PatientsModule } from '../patients/patients.module';
import { UsersModule } from '../users/users.module';
import { PatientRequirementsController } from './patient-requirements.controller';
import { PatientRequirementsRepository } from './patient-requirements.repository';
import { PatientRequirementsService } from './patient-requirements.service';

@Module({
  imports: [
    CryptographyModule,
    UsersModule,
    PatientsModule,
    TypeOrmModule.forFeature([PatientRequirement]),
  ],
  controllers: [PatientRequirementsController],
  providers: [PatientRequirementsService, PatientRequirementsRepository],
  exports: [PatientRequirementsRepository],
})
export class PatientRequirementsModule {}
