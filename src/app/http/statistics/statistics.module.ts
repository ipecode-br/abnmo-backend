import { Module } from '@nestjs/common';

import { UtilsModule } from '@/utils/utils.module';

import { PatientsModule } from '../patients/patients.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [PatientsModule, UtilsModule, ReferralsModule],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
