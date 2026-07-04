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
    const query = this.referralsRepository
      .createQueryBuilder('r')
      .innerJoin('r.patient', 'patient')
      .innerJoin('patient.survey', 'survey')
      .andWhere('patient.status != :status', { status: 'pending' });

    if (period) {
      const dateRange = getDateRangeForPeriod(period);
      query.andWhere('r.createdAt BETWEEN :start AND :end', {
        start: dateRange.startDate,
        end: dateRange.endDate,
      });
    }

    if (startDate && !endDate) {
      query.andWhere('r.createdAt >= :startDate', { startDate });
    }

    if (endDate && !startDate) {
      query.andWhere('r.createdAt <= :endDate', { endDate });
    }

    if (startDate && endDate) {
      query.andWhere('r.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
    }

    query.select('COUNT(DISTINCT r.patient_id)', 'count');

    const result = await query.getRawOne<{ count: string }>();

    return Number(result?.count) || 0;
  }
}
