import { Module } from '@nestjs/common';

import { UtilsModule } from '@/utils/utils.module';

import { PatientsModule } from '../patients/patients.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { GetReferredPatientsByStateUseCase } from './use-cases/get-referred-patients-by-state.use-case';

@Module({
  imports: [PatientsModule, UtilsModule, ReferralsModule],
  controllers: [StatisticsController],
  providers: [StatisticsService, GetReferredPatientsByStateUseCase],
})
export class StatisticsModule {}
