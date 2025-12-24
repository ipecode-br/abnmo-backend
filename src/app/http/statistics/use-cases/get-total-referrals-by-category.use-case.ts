import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';

import { Referral } from '@/domain/entities/referral';
import type { TotalReferralsByCategory } from '@/domain/schemas/statistics/responses';
import { UtilsService } from '@/utils/utils.service';

import type { GetTotalReferralsByCategoryQuery } from '../statistics.dtos';

interface GetTotalReferralsByCategoryUseCaseRequest {
  query: GetTotalReferralsByCategoryQuery;
}

type GetTotalReferralsByCategoryUseCaseResponse = Promise<{
  categories: TotalReferralsByCategory[];
  total: number;
}>;

@Injectable()
export class GetTotalReferralsByCategoryUseCase {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
    private readonly utilsService: UtilsService,
  ) {}

  async execute({
    query,
  }: GetTotalReferralsByCategoryUseCaseRequest): GetTotalReferralsByCategoryUseCaseResponse {
    const { startDate, endDate } = this.utilsService.getDateRangeForPeriod(
      query.period,
    );

    const createQueryBuilder = (): SelectQueryBuilder<Referral> => {
      return this.referralsRepository.createQueryBuilder('referral');
    };

    function getQueryBuilderWithFilters(
      queryBuilder: SelectQueryBuilder<Referral>,
    ) {
      if (startDate && endDate) {
        queryBuilder.andWhere('referral.created_at BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        });
      }

      return queryBuilder;
    }

    const categoryListQuery = getQueryBuilderWithFilters(
      createQueryBuilder()
        .select('referral.category', 'category')
        .addSelect('COUNT(referral.id)', 'total')
        .groupBy('referral.category')
        .orderBy('COUNT(referral.id)', 'DESC')
        .limit(query.limit),
    );

    const totalCategoriesQuery = getQueryBuilderWithFilters(
      createQueryBuilder().select('COUNT(DISTINCT referral.category)', 'total'),
    );

    const [categories, totalResult] = await Promise.all([
      categoryListQuery.getRawMany<TotalReferralsByCategory>(),
      totalCategoriesQuery.getRawOne<{ total: string }>(),
    ]);

    return {
      categories,
      total: Number(totalResult?.total || 0),
    };
  }
}
