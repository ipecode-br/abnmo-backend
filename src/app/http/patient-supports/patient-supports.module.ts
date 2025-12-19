import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Patient } from '@/domain/entities/patient';
import { PatientSupport } from '@/domain/entities/patient-support';

import { PatientSupportsController } from './patient-supports.controller';
import { CreatePatientSupportUseCase } from './use-cases/create-patient-support.use-case';
import { DeletePatientSupportUseCase } from './use-cases/delete-patient-support.use-case';
import { UpdatePatientSupportUseCase } from './use-cases/update-patient-support.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, PatientSupport])],
  controllers: [PatientSupportsController],
  providers: [
    CreatePatientSupportUseCase,
    UpdatePatientSupportUseCase,
    DeletePatientSupportUseCase,
  ],
})
export class PatientSupportsModule {}
