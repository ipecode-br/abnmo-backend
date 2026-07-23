import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';

import { Referral } from '@/domain/entities/referral';
import type { QueryPeriod } from '@/domain/enums/queries';
import { getDateRangeForPeriod } from '@/utils/get-date-range-for-period';

interface GetTotalPatientsWithReferralsUseCaseInput {
  period?: QueryPeriod;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class GetTotalPatientsWithReferralsUseCase {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
  ) {}

  async execute({
    period,
    startDate,
    endDate,
  }: GetTotalPatientsWithReferralsUseCaseInput = {}): Promise<number> {
    const dateRange = period
      ? getDateRangeForPeriod(period)
      : { startDate, endDate };

    const query = this.referralsRepository
      .createQueryBuilder('referral')
      .innerJoin('referral.patient', 'user')
      .innerJoin('user.survey', 'survey')
      .where('user.status != :status', { status: 'pending' });

    if (dateRange.startDate && dateRange.endDate) {
      query.andWhere('referral.date BETWEEN :start AND :end', {
        start: dateRange.startDate,
        end: dateRange.endDate,
      });
    }

    if (dateRange.startDate && !dateRange.endDate) {
      query.andWhere('referral.date >= :startDate', {
        startDate: dateRange.startDate,
      });
    }

    if (dateRange.endDate && !dateRange.startDate) {
      query.andWhere('referral.date <= :endDate', {
        endDate: dateRange.endDate,
      });
    }

    query.select('COUNT(DISTINCT referral.patient.id)', 'count');

    const result = await query.getRawOne<{ count: string }>();

    return Number(result?.count) || 0;
  }
}
