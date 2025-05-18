import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PatientsModule } from '@/patients/patients.module';

import { PatientSupport } from './entities/patient-support.entity';
import { PatientSupportsController } from './patient-supports.controller';
import { PatientSupportsRepository } from './patient-supports.repository';
import { PatientSupportsService } from './patient-supports.service';

@Module({
  imports: [PatientsModule, TypeOrmModule.forFeature([PatientSupport])],
  controllers: [PatientSupportsController],
  providers: [PatientSupportsService, PatientSupportsRepository],
})
export class PatientSupportsModule {}
