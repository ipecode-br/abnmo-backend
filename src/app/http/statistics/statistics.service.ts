import { Injectable } from '@nestjs/common';

import type {
  GetTotalPatientsByStatusResponse,
  PatientsStatisticField,
} from '@/domain/schemas/statistics';
import { UtilsService } from '@/utils/utils.service';

import { PatientsRepository } from '../patients/patients.repository';
import { ReferralsRepository } from '../referrals/referrals.repository';
import type {
  GetPatientsByPeriodQuery,
  GetTotalReferralsAndReferredPatientsPercentageQuery,
} from './statistics.dtos';

@Injectable()
export class StatisticsService {
  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly utilsService: UtilsService,
    private readonly referralsRepository: ReferralsRepository,
  ) {}

  async getPatientsTotal(): Promise<GetTotalPatientsByStatusResponse['data']> {
    return await this.patientsRepository.getTotalPatientsByStatus();
  }

  async getPatientsByPeriod<T>(
    filter: PatientsStatisticField,
    query: GetPatientsByPeriodQuery,
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

    const percentage =
      Number((totalReferredPatients / totalPatients) * 100) || 0;

    return {
      totalReferrals,
      referredPatientsPercentage: Number(percentage.toFixed(2)),
    };
  }
}
