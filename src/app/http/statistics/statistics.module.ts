import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from '@/domain/entities/appointment';
import { Patient } from '@/domain/entities/patient';
import { Referral } from '@/domain/entities/referral';

import { StatisticsController } from './statistics.controller';
import { GetTotalAppointmentsUseCase } from './use-cases/get-total-appointments.use-case';
import { GetTotalAppointmentsByCategoryUseCase } from './use-cases/get-total-appointments-by-category.use-case';
import { GetTotalPatientsUseCase } from './use-cases/get-total-patients.use-case';
import { GetTotalPatientsByFieldUseCase } from './use-cases/get-total-patients-by-field.use-case';
import { GetTotalPatientsWithAppointmentsUseCase } from './use-cases/get-total-patients-with-appointments.use-case';
import { GetTotalPatientsWithAppointmentsByStateUseCase } from './use-cases/get-total-patients-with-appointments-by-state';
import { GetTotalPatientsWithReferralsUseCase } from './use-cases/get-total-patients-with-referrals.use-case';
import { GetTotalPatientsWithReferralsByStateUseCase } from './use-cases/get-total-patients-with-referrals-by-state.use-case';
import { GetTotalReferralsUseCase } from './use-cases/get-total-referrals.use-case';
import { GetTotalReferralsByCategoryUseCase } from './use-cases/get-total-referrals-by-category.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Patient, Referral])],
  controllers: [StatisticsController],
  providers: [
    GetTotalAppointmentsUseCase,
    GetTotalAppointmentsByCategoryUseCase,
    GetTotalPatientsUseCase,
    GetTotalPatientsByFieldUseCase,
    GetTotalPatientsWithAppointmentsUseCase,
    GetTotalPatientsWithAppointmentsByStateUseCase,
    GetTotalPatientsWithReferralsUseCase,
    GetTotalPatientsWithReferralsByStateUseCase,
    GetTotalReferralsUseCase,
    GetTotalReferralsByCategoryUseCase,
  ],
})
export class StatisticsModule {}
