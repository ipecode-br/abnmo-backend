import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from '@/domain/entities/appointment';
import { User } from '@/domain/entities/user';

import { AppointmentsController } from './appointments.controller';
import { CancelAppointmentUseCase } from './use-cases/cancel-appointment.use-case';
import { CreateAppointmentUseCase } from './use-cases/create-appointment.use-case';
import { GetAppointmentsUseCase } from './use-cases/get-appointments.use-case';
import { UpdateAppointmentUseCase } from './use-cases/update-appointment.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, User])],
  controllers: [AppointmentsController],
  providers: [
    CancelAppointmentUseCase,
    CreateAppointmentUseCase,
    GetAppointmentsUseCase,
    UpdateAppointmentUseCase,
  ],
})
export class AppointmentsModule {}
