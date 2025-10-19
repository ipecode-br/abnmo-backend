import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from '@/domain/entities/appointment';

import { PatientsModule } from '../patients/patients.module';
import { SpecialistsModule } from '../specialists/specialists.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsRepository } from './appointments.repository';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [
    PatientsModule,
    SpecialistsModule,
    TypeOrmModule.forFeature([Appointment]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository],
  exports: [AppointmentsRepository],
})
export class AppointmentsModule {}
