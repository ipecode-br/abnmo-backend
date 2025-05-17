import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DiagnosticsModule } from '@/diagnostics/diagnostics.module';
import { UsersModule } from '@/users/users.module';

import { Patient } from './entities/patient.entity';
import { PatientsController } from './patients.controller';
import { PatientsRepository } from './patients.repository';
import { PatientsService } from './patients.service';

@Module({
  imports: [
    UsersModule,
    DiagnosticsModule,
    TypeOrmModule.forFeature([Patient]),
  ],
  controllers: [PatientsController],
  providers: [PatientsService, PatientsRepository],
  exports: [PatientsRepository],
})
export class PatientsModule {}
