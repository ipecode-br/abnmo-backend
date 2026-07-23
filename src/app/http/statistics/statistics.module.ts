import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from '@/domain/entities/appointment';
import { Referral } from '@/domain/entities/referral';
import { User } from '@/domain/entities/user';

import { StatisticsController } from './statistics.controller';
import { GetTotalAppointmentsUseCase } from './use-cases/get-total-appointments.use-case';
import { GetTotalAppointmentsByCategoryUseCase } from './use-cases/get-total-appointments-by-category.use-case';
import { GetTotalPatientsUseCase } from './use-cases/get-total-patients.use-case';
import { GetTotalPatientsByFieldUseCase } from './use-cases/get-total-patients-by-field.use-case';
import { GetTotalPatientsWithAppointmentsUseCase } from './use-cases/get-total-patients-with-appointments.use-case';
import { GetTotalPatientsWithAppointmentsByFieldUseCase } from './use-cases/get-total-patients-with-appointments-by-field.use-case';
import { GetTotalPatientsWithReferralsUseCase } from './use-cases/get-total-patients-with-referrals.use-case';
import { GetTotalPatientsWithReferralsByFieldUseCase } from './use-cases/get-total-patients-with-referrals-by-field.use-case';
import { GetTotalReferralsUseCase } from './use-cases/get-total-referrals.use-case';
import { GetTotalReferralsByCategoryUseCase } from './use-cases/get-total-referrals-by-category.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, User, Referral])],
  controllers: [StatisticsController],
  providers: [
    GetTotalAppointmentsByCategoryUseCase,
    GetTotalAppointmentsUseCase,
    GetTotalPatientsByFieldUseCase,
    GetTotalPatientsUseCase,
    GetTotalPatientsWithAppointmentsByFieldUseCase,
    GetTotalPatientsWithAppointmentsUseCase,
    GetTotalPatientsWithReferralsByFieldUseCase,
    GetTotalPatientsWithReferralsUseCase,
    GetTotalReferralsByCategoryUseCase,
    GetTotalReferralsUseCase,
  ],
})
export class StatisticsModule {}
