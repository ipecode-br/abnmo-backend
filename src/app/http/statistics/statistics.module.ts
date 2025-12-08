import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Patient } from '@/domain/entities/patient';
import { Referral } from '@/domain/entities/referral';
import { UtilsModule } from '@/utils/utils.module';

import { StatisticsController } from './statistics.controller';
import { GetTotalPatientsUseCase } from './use-cases/get-total-patients.use-case';
import { GetTotalPatientsByFieldUseCase } from './use-cases/get-total-patients-by-field.use-case';
import { GetTotalPatientsByStatusUseCase } from './use-cases/get-total-patients-by-status.use-case';
import { GetTotalReferralsUseCase } from './use-cases/get-total-referrals.use-case';
import { GetTotalReferralsAndReferredPatientsPercentageUseCase } from './use-cases/get-total-referrals-and-referred-patients-percentage.use-case';
import { GetTotalReferralsByCategoryUseCase } from './use-cases/get-total-referrals-by-category.use-case';
import { GetTotalReferredPatientsUseCase } from './use-cases/get-total-referred-patients.use-case';
import { GetTotalReferredPatientsByStateUseCase } from './use-cases/get-total-referred-patients-by-state.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, Referral]), UtilsModule],
  controllers: [StatisticsController],
  providers: [
    GetTotalPatientsUseCase,
    GetTotalPatientsByFieldUseCase,
    GetTotalPatientsByStatusUseCase,
    GetTotalReferralsUseCase,
    GetTotalReferralsByCategoryUseCase,
    GetTotalReferralsAndReferredPatientsPercentageUseCase,
    GetTotalReferredPatientsUseCase,
    GetTotalReferredPatientsByStateUseCase,
  ],
})
export class StatisticsModule {}
