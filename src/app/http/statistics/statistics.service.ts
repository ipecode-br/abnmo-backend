import { Injectable } from '@nestjs/common';

import type {
  GetPatientsTotalResponseSchema,
  GetReferralsTotalResponseSchema,
  PatientsStatisticFieldType,
} from '@/domain/schemas/statistics';
import { UtilsService } from '@/utils/utils.service';

import { PatientsRepository } from '../patients/patients.repository';
import { ReferralsRepository } from '../referrals/referrals.repository';
import type {
  GetPatientsByPeriodDto,
  GetReferralsTotalDto,
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

  async getReferralsTotal(
    filters: GetReferralsTotalDto,
  ): Promise<GetReferralsTotalResponseSchema['data']> {
    return await this.referralsRepository.getReferralsTotal(filters);
  }
}
