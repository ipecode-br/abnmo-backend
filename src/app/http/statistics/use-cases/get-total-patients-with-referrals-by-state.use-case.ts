import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import type { QueryPeriod } from '@/domain/enums/queries';
import type { TotalPatientsWithReferralsByState } from '@/domain/schemas/statistics/responses';
import { getDateRangeForPeriod } from '@/utils/get-date-range-for-period';

interface GetTotalPatientsWithReferralsByStateUseCaseInput {
  period?: QueryPeriod;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

interface GetTotalPatientsWithReferralsByStateUseCaseOutput {
  states: TotalPatientsWithReferralsByState[];
  total: number;
}

@Injectable()
export class GetTotalPatientsWithReferralsByStateUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  async execute({
    period,
    startDate,
    endDate,
    limit,
  }: GetTotalPatientsWithReferralsByStateUseCaseInput = {}): Promise<GetTotalPatientsWithReferralsByStateUseCaseOutput> {
    const dateRange = period
      ? getDateRangeForPeriod(period)
      : { startDate, endDate };

    const createBaseQuery = (): SelectQueryBuilder<Patient> => {
      const baseQuery = this.patientsRepository
        .createQueryBuilder('patient')
        .innerJoin('patient.referrals', 'referral')
        .where('patient.status != :status', { status: 'pending' });

      if (dateRange.startDate && dateRange.endDate) {
        baseQuery.andWhere('referral.date BETWEEN :start AND :end', {
          start: dateRange.startDate,
          end: dateRange.endDate,
        });
      }

      return baseQuery;
    };

    const listStatesQuery = createBaseQuery()
      .select('patient.state', 'state')
      .addSelect('COUNT(DISTINCT patient.id)', 'total');

    listStatesQuery
      .addSelect(
        `ROUND(
          (COUNT(DISTINCT patient.id) / SUM(COUNT(DISTINCT patient.id)) OVER()) * 100,
          1
        )`,
        'percentage',
      )
      .groupBy('patient.state')
      .orderBy('COUNT(DISTINCT patient.id)', 'DESC')
      .limit(limit);

    const totalQuery = createBaseQuery().select(
      'COUNT(DISTINCT patient.state)',
      'total',
    );

    const [states, totalResult] = await Promise.all([
      listStatesQuery.getRawMany<TotalPatientsWithReferralsByState>(),
      totalQuery.getRawOne<{ total: string }>(),
    ]);

    const totalPatients = Number(totalResult?.total || 0);

    return { states, total: totalPatients };
  }
}
