import { BadRequestException, Injectable } from '@nestjs/common';
import {
  endOfWeek,
  startOfWeek,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';

import type { GetPatientsTotalResponseSchema } from '@/domain/schemas/statistics';

import { GetPatientStatisticsDto } from '../patients/patients.dtos';
import { PatientsRepository } from '../patients/patients.repository';

@Injectable()
export class StatisticsService {
  constructor(private readonly patientsRepository: PatientsRepository) {}

  async getPatientStatistics(filters: GetPatientStatisticsDto) {
    const { period } = filters;

    let startDate: Date;
    let endDate: Date;

    const today = new Date();

    switch (period) {
      case 'last-week':
        startDate = startOfWeek(subWeeks(today, 1), { weekStartsOn: 0 });
        endDate = endOfWeek(today, { weekStartsOn: 0 });
        break;
      case 'last-month':
        startDate = startOfWeek(subMonths(today, 1), { weekStartsOn: 0 });
        endDate = endOfWeek(today, { weekStartsOn: 0 });
        break;
      case 'last-year':
        startDate = startOfWeek(subYears(today, 1), { weekStartsOn: 0 });
        endDate = endOfWeek(today, { weekStartsOn: 0 });
        break;
      default:
        throw new BadRequestException('Período inválido.');
    }

    const rawStats = await this.patientsRepository.getPatientStatisticsByPeriod(
      'gender',
      startDate,
      endDate,
    );

    return rawStats.map((row) => ({
      gender: row.gender,
      total: Number(row.total),
    }));
  }

  async getPatientsTotal(): Promise<GetPatientsTotalResponseSchema['data']> {
    return await this.patientsRepository.getPatientsTotal();
  }
}
