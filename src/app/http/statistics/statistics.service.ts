import { Injectable } from '@nestjs/common';

import type {
  GetPatientsTotalResponseSchema,
  PatientsByStateType,
  PatientsStatisticFieldType,
} from '@/domain/schemas/statistics';
import { UtilsService } from '@/utils/utils.service';

import { PatientsRepository } from '../patients/patients.repository';
import type { GetPatientsByPeriodDto } from './statistics.dtos';

@Injectable()
export class StatisticsService {
  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly utilsService: UtilsService,
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

  async getReferredPatientsByState(
    query: GetPatientsByPeriodDto,
  ): Promise<{ items: PatientsByStateType[]; total: number }> {
    const { startDate, endDate } = this.utilsService.getDateRangeForPeriod(
      query.period,
    );
    return await this.patientsRepository.getPatientsWithReferralsByState(
      startDate,
      endDate,
      query,
    );
  }
}
