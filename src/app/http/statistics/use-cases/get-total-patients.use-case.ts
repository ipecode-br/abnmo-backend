import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';

import { User } from '@/domain/entities/user';
import type { QueryPeriod } from '@/domain/enums/queries';
import { getDateRangeForPeriod } from '@/utils/get-date-range-for-period';

interface GetTotalPatientsUseCaseInput {
  status?: string;
  period?: QueryPeriod;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class GetTotalPatientsUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async execute({
    status,
    period,
    startDate,
    endDate,
  }: GetTotalPatientsUseCaseInput = {}): Promise<number> {
    const dateRange = period
      ? getDateRangeForPeriod(period)
      : { startDate, endDate };

    const query: SelectQueryBuilder<User> = this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.survey', 'survey')
      .where('user.role = :role', { role: 'patient' })
      .andWhere('user.status != :pending', { pending: 'pending' });

    if (dateRange.startDate && dateRange.endDate) {
      query.andWhere('user.created_at BETWEEN :start AND :end', {
        start: dateRange.startDate,
        end: dateRange.endDate,
      });
    }

    if (dateRange.startDate && !dateRange.endDate) {
      query.andWhere('user.created_at >= :startDate', {
        startDate: dateRange.startDate,
      });
    }

    if (dateRange.endDate && !dateRange.startDate) {
      query.andWhere('user.created_at <= :endDate', {
        endDate: dateRange.endDate,
      });
    }

    if (status) {
      query.andWhere('user.status = :status', { status });
    }

    query.select('COUNT(DISTINCT user.id)', 'count');

    const result = await query.getRawOne<{ count: string }>();

    return Number(result?.count) || 0;
  }
}
