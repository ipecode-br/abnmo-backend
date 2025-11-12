import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CryptographyModule } from '@/app/cryptography/cryptography.module';
import { Patient } from '@/domain/entities/patient';
import { PatientRequirement } from '@/domain/entities/patient-requirement';
import { User } from '@/domain/entities/user';

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
    TypeOrmModule.forFeature([PatientRequirement, Patient, User]),
  ],
  controllers: [PatientRequirementsController],
  providers: [PatientRequirementsService, PatientRequirementsRepository],
  exports: [PatientRequirementsRepository],
})
export class PatientRequirementsModule {}
