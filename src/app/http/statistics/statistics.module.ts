import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from '@/domain/entities/appointment';
import { Patient } from '@/domain/entities/patient';
import { Referral } from '@/domain/entities/referral';
import { UtilsModule } from '@/utils/utils.module';

import { StatisticsController } from './statistics.controller';
import { GetTotalAppointmentsUseCase } from './use-cases/get-total-appointments.use-case';
import { GetTotalAppointmentsByCategoryUseCase } from './use-cases/get-total-appointments-by-category.use-case';
import { GetTotalPatientsUseCase } from './use-cases/get-total-patients.use-case';
import { GetTotalPatientsByFieldUseCase } from './use-cases/get-total-patients-by-field.use-case';
import { GetTotalPatientsByStatusUseCase } from './use-cases/get-total-patients-by-status.use-case';
import { GetTotalPatientsWithAppointmentsUseCase } from './use-cases/get-total-patients-with-appointments.use-case';
import { GetTotalPatientsWithAppointmentsByStateUseCase } from './use-cases/get-total-patients-with-appointments-by-state';
import { GetTotalReferralsUseCase } from './use-cases/get-total-referrals.use-case';
import { GetTotalReferralsByCategoryUseCase } from './use-cases/get-total-referrals-by-category.use-case';
import { GetTotalReferredPatientsUseCase } from './use-cases/get-total-referred-patients.use-case';
import { GetTotalReferredPatientsByStateUseCase } from './use-cases/get-total-referred-patients-by-state.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, Referral, Appointment]),
    UtilsModule,
  ],
  controllers: [StatisticsController],
  providers: [
    GetTotalAppointmentsUseCase,
    GetTotalAppointmentsByCategoryUseCase,
    GetTotalPatientsUseCase,
    GetTotalPatientsByFieldUseCase,
    GetTotalPatientsByStatusUseCase,
    GetTotalPatientsWithAppointmentsUseCase,
    GetTotalPatientsWithAppointmentsByStateUseCase,
    GetTotalReferralsUseCase,
    GetTotalReferralsByCategoryUseCase,
    GetTotalReferredPatientsUseCase,
    GetTotalReferredPatientsByStateUseCase,
  ],
})
export class StatisticsModule {}
