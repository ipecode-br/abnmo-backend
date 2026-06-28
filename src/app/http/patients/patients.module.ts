import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '@/domain/entities/user';

import { PatientsController } from './patients.controller';
import { DeactivatePatientUseCase } from './use-cases/deactivate-patient.use-case';
import { GetPatientUseCase } from './use-cases/get-patient.use-case';
import { GetPatientOptionsUseCase } from './use-cases/get-patient-options.use-case';
import { GetPatientsUseCase } from './use-cases/get-patients.use-case';
import { UpdatePatientUseCase } from './use-cases/update-patient.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [PatientsController],
  providers: [
    DeactivatePatientUseCase,
    GetPatientOptionsUseCase,
    GetPatientUseCase,
    GetPatientsUseCase,
    UpdatePatientUseCase,
  ],
})
export class PatientsModule {}
