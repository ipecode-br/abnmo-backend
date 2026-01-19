import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import type { QueryPeriod } from '@/domain/enums/queries';
import type { TotalReferredPatientsByState } from '@/domain/schemas/statistics/responses';
import { UtilsService } from '@/utils/utils.service';

interface GetTotalReferredPatientsByStateUseCaseInput {
  period?: QueryPeriod;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

interface GetTotalReferredPatientsByStateUseCaseOutput {
  states: TotalReferredPatientsByState[];
  total: number;
}

@Injectable()
export class GetTotalReferredPatientsByStateUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly utilsService: UtilsService,
  ) {}

  async execute({
    period,
    startDate,
    endDate,
    limit,
  }: GetTotalReferredPatientsByStateUseCaseInput = {}): Promise<GetTotalReferredPatientsByStateUseCaseOutput> {
    const dateRange = period
      ? this.utilsService.getDateRangeForPeriod(period)
      : { startDate, endDate };

    const createBaseQuery = (): SelectQueryBuilder<Patient> => {
      const baseQuery = this.patientsRepository
        .createQueryBuilder('patient')
        .innerJoin('patient.referrals', 'referral')
        .where('referral.id IS NOT NULL');

      if (dateRange.startDate && dateRange.endDate) {
        baseQuery.andWhere('referral.created_at BETWEEN :start AND :end', {
          start: dateRange.startDate,
          end: dateRange.endDate,
        });
      }

      return baseQuery;
    };

    const listStatesQuery = createBaseQuery()
      .select('patient.state', 'state')
      .addSelect('COUNT(DISTINCT patient.id)', 'total')
      .groupBy('patient.state')
      .orderBy('COUNT(DISTINCT patient.id)', 'DESC')
      .limit(limit);

    const totalQuery = createBaseQuery().select(
      'COUNT(DISTINCT patient.state)',
      'total',
    );

    const [states, totalResult] = await Promise.all([
      listStatesQuery.getRawMany<TotalReferredPatientsByState>(),
      totalQuery.getRawOne<{ total: string }>(),
    ]);

    return { states, total: Number(totalResult?.total || 0) };
  }
}
