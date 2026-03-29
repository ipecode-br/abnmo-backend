import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';

import { Referral } from '@/domain/entities/referral';
import type { QueryPeriod } from '@/domain/enums/queries';
import type { TotalReferralsByCategory } from '@/domain/schemas/statistics/responses';
import { getDateRangeForPeriod } from '@/utils/get-date-range-for-period';

interface GetTotalReferralsByCategoryUseCaseInput {
  patientId?: string;
  period?: QueryPeriod;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

interface GetTotalReferralsByCategoryUseCaseOutput {
  categories: TotalReferralsByCategory[];
  total: number;
}

@Injectable()
export class GetTotalReferralsByCategoryUseCase {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
  ) {}

  async execute({
    patientId,
    period,
    startDate,
    endDate,
    limit,
  }: GetTotalReferralsByCategoryUseCaseInput = {}): Promise<GetTotalReferralsByCategoryUseCaseOutput> {
    const dateRange = period
      ? getDateRangeForPeriod(period)
      : { startDate, endDate };

    const createBaseQuery = (): SelectQueryBuilder<Referral> => {
      const baseQuery = this.referralsRepository.createQueryBuilder('referral');

      if (dateRange.startDate && dateRange.endDate) {
        baseQuery.where('referral.date BETWEEN :start AND :end', {
          start: dateRange.startDate,
          end: dateRange.endDate,
        });
      }

      if (patientId) {
        baseQuery.andWhere('referral.patient_id = :patientId', {
          patientId,
        });
      }

      return baseQuery;
    };

    const listCategoriesQuery = createBaseQuery()
      .select('referral.category', 'category')
      .addSelect('COUNT(referral.id)', 'total')
      .groupBy('referral.category')
      .orderBy('COUNT(referral.id)', 'DESC')
      .limit(limit);

    const totalQuery = createBaseQuery().select(
      'COUNT(DISTINCT referral.category)',
      'total',
    );

    const [categories, totalResult] = await Promise.all([
      listCategoriesQuery.getRawMany<TotalReferralsByCategory>(),
      totalQuery.getRawOne<{ total: string }>(),
    ]);

    return { categories, total: Number(totalResult?.total || 0) };
  }
}
