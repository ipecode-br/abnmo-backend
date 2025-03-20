import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { PatientRepository } from './patient.repository';
import { UserModule } from 'src/user/user.module';
import { DiagnosisModule } from 'src/diagnosis/diagnosis.module';

@Module({
  imports: [UserModule, DiagnosisModule, TypeOrmModule.forFeature([Patient])],
  controllers: [PatientController],
  providers: [PatientService, PatientRepository],
  exports: [PatientRepository],
})
export class PatientModule {}
