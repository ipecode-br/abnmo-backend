import { Injectable } from '@nestjs/common';

import type {
  GetPatientsTotalResponseSchema,
  PatientsStatisticFieldType,
} from '@/domain/schemas/statistics';
import { UtilsService } from '@/utils/utils.service';

import { PatientsRepository } from '../patients/patients.repository';
import { ReferralsRepository } from '../referrals/referrals.repository';
import type {
  GetPatientsByPeriodDto,
  GetTotalReferralsAndReferredPatientsPercentageQuery,
} from './statistics.dtos';

@Injectable()
export class StatisticsService {
  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly utilsService: UtilsService,
    private readonly referralsRepository: ReferralsRepository,
  ) {}

  async getPatientsTotal(): Promise<GetPatientsTotalResponseSchema['data']> {
    return await this.patientsRepository.getPatientsTotal();
  }

  async getPatientsByPeriod<T>(
    filter: PatientsStatisticFieldType,
    query: GetPatientsByPeriodDto,
  ): Promise<{ items: T[]; total: number }> {
    const { startDate, endDate } = this.utilsService.getDateRangeForPeriod(
      query.period,
    );

    return await this.patientsRepository.getPatientsStatisticsByPeriod(
      filter,
      startDate,
      endDate,
      query,
    );
  }

  async getTotalReferralsAndReferredPatientsPercentage(
    query: GetTotalReferralsAndReferredPatientsPercentageQuery,
  ): Promise<{ totalReferrals: number; referredPatientsPercentage: number }> {
    const { startDate, endDate } = this.utilsService.getDateRangeForPeriod(
      query.period,
    );

    const [totalPatients, totalReferrals, totalReferredPatients] =
      await Promise.all([
        this.patientsRepository.getTotalPatients({ startDate, endDate }),
        this.referralsRepository.getTotalReferrals({ startDate, endDate }),
        this.patientsRepository.getTotalReferredPatients({
          startDate,
          endDate,
        }),
      ]);

    console.log([totalPatients, totalReferrals, totalReferredPatients]);

    const percentage = Number((totalReferredPatients / totalPatients) * 100);

    return {
      totalReferrals,
      referredPatientsPercentage: Number(percentage.toFixed(2)),
    };
  }
}
