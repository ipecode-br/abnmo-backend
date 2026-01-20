import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';

import { Referral } from '@/domain/entities/referral';
import type { QueryPeriod } from '@/domain/enums/queries';
import type { TotalReferralsByCategory } from '@/domain/schemas/statistics/responses';
import { UtilsService } from '@/utils/utils.service';

interface GetTotalReferralsByCategoryUseCaseInput {
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
    private readonly utilsService: UtilsService,
  ) {}

  async execute({
    period,
    startDate,
    endDate,
    limit,
  }: GetTotalReferralsByCategoryUseCaseInput = {}): Promise<GetTotalReferralsByCategoryUseCaseOutput> {
    const dateRange = period
      ? this.utilsService.getDateRangeForPeriod(period)
      : { startDate, endDate };

    const createBaseQuery = (): SelectQueryBuilder<Referral> => {
      const baseQuery = this.referralsRepository.createQueryBuilder('referral');

      if (dateRange.startDate && dateRange.endDate) {
        baseQuery.where('referral.created_at BETWEEN :start AND :end', {
          start: dateRange.startDate,
          end: dateRange.endDate,
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
