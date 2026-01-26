import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Patient } from '@/domain/entities/patient';

import { PatientsController } from './patients.controller';
import { CreatePatientUseCase } from './use-cases/create-patient.use-case';
import { DeactivatePatientUseCase } from './use-cases/deactivate-patient.use-case';
import { GetPatientUseCase } from './use-cases/get-patient.use-case';
import { GetPatientOptionsUseCase } from './use-cases/get-patient-options.use-case';
import { GetPatientsUseCase } from './use-cases/get-patients.use-case';
import { UpdatePatientUseCase } from './use-cases/update-patient.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Patient])],
  controllers: [PatientsController],
  providers: [
    GetPatientUseCase,
    GetPatientsUseCase,
    GetPatientOptionsUseCase,
    CreatePatientUseCase,
    UpdatePatientUseCase,
    DeactivatePatientUseCase,
  ],
})
export class PatientsModule {}
