import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  type FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
  type SelectQueryBuilder,
} from 'typeorm';

import { Referral } from '@/domain/entities/referral';
import type { ReferralStatus } from '@/domain/enums/referrals';
import type { CategoryTotalReferrals } from '@/domain/schemas/statistics';

@Injectable()
export class ReferralsRepository {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
  ) {}

  public async findById(id: string): Promise<Referral | null> {
    return await this.referralsRepository.findOne({ where: { id } });
  }

  public async cancel(id: string): Promise<Referral> {
    return await this.referralsRepository.save({ id, status: 'canceled' });
  }

  public async getTotalReferrals(
    input: {
      status?: ReferralStatus;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<number> {
    const { status, startDate, endDate } = input;

    const where: FindOptionsWhere<Referral> = {};

    if (status) {
      where.status = status;
    }

    if (startDate && !endDate) {
      where.date = MoreThanOrEqual(startDate);
    }

    if (endDate && !startDate) {
      where.date = LessThanOrEqual(endDate);
    }

    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }

    return await this.referralsRepository.count({ where });
  }

  public async getTotalReferralsByCategory(
    input: { startDate?: Date; endDate?: Date; limit?: number } = {},
  ): Promise<{ categories: CategoryTotalReferrals[]; total: number }> {
    const { startDate, endDate, limit = 10 } = input;

    function getQueryBuilderWithFilters(
      queryBuilder: SelectQueryBuilder<Referral>,
    ) {
      if (startDate && endDate) {
        queryBuilder.andWhere('referral.date BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        });
      }

      return queryBuilder;
    }

    const createQueryBuilder = (): SelectQueryBuilder<Referral> => {
      return this.referralsRepository.createQueryBuilder('referral');
    };

    const categoryListQuery = getQueryBuilderWithFilters(
      createQueryBuilder()
        .select('referral.category', 'category')
        .addSelect('COUNT(referral.id)', 'total')
        .groupBy('referral.category')
        .orderBy('COUNT(referral.id)', 'DESC')
        .limit(limit),
    );

    const totalCategoriesQuery = getQueryBuilderWithFilters(
      createQueryBuilder().select('COUNT(DISTINCT referral.category)', 'total'),
    );

    const [categories, totalResult] = await Promise.all([
      categoryListQuery.getRawMany<CategoryTotalReferrals>(),
      totalCategoriesQuery.getRawOne<{ total: string }>(),
    ]);

    return {
      categories,
      total: Number(totalResult?.total || 0),
    };
  }
}
