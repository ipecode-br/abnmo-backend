import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CryptographyModule } from '@/app/cryptography/cryptography.module';
import { UsersModule } from '@/app/http/users/users.module';
import { Patient } from '@/domain/entities/patient';

import { PatientSupportsModule } from '../patient-supports/patient-supports.module';
import { PatientsController } from './patients.controller';
import { PatientsRepository } from './patients.repository';
import { PatientsService } from './patients.service';

@Module({
  imports: [
    CryptographyModule,
    UsersModule,
    TypeOrmModule.forFeature([Patient]),
    forwardRef(() => PatientSupportsModule),
  ],
  controllers: [PatientsController],
  providers: [PatientsService, PatientsRepository],
  exports: [PatientsRepository, TypeOrmModule.forFeature([Patient])],
})
export class PatientsModule {}
