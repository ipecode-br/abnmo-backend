import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Referral } from '@/domain/entities/referral';
import { UtilsModule } from '@/utils/utils.module';

import { PatientsModule } from '../patients/patients.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { GetReferredPatientsByStateUseCase } from './use-cases/get-referred-patients-by-state.use-case';
import { GetTotalReferralsByCategoryUseCase } from './use-cases/get-total-referrals-by-category.use-case';

@Module({
  imports: [
    PatientsModule,
    UtilsModule,
    ReferralsModule,
    TypeOrmModule.forFeature([Referral]),
  ],
  controllers: [StatisticsController],
  providers: [
    StatisticsService,
    GetReferredPatientsByStateUseCase,
    GetTotalReferralsByCategoryUseCase,
  ],
})
export class StatisticsModule {}
