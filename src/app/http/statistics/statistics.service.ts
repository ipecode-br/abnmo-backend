import { Injectable } from '@nestjs/common';

import type { GenderType } from '@/domain/schemas/patient';
import type {
  GetPatientsByGenderResponse,
  GetPatientsTotalResponseSchema,
} from '@/domain/schemas/statistics';
import { UtilsService } from '@/utils/utils.service';

import { PatientsRepository } from '../patients/patients.repository';
import type { GetPatientsByGenderDto } from './statistics.dtos';

@Injectable()
export class StatisticsService {
  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly utilsService: UtilsService,
  ) {}

  async getPatientsTotal(): Promise<GetPatientsTotalResponseSchema['data']> {
    return await this.patientsRepository.getPatientsTotal();
  }

  async getPatientsByGender(
    query: GetPatientsByGenderDto,
  ): Promise<GetPatientsByGenderResponse['data']> {
    const { startDate, endDate } = this.utilsService.getDateRangeForPeriod(
      query.period,
    );

    return await this.patientsRepository.getPatientsStatisticsByPeriod<{
      gender: GenderType;
      total: number;
    }>('gender', startDate, endDate);
  }
}
