import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';

import { User } from '@/domain/entities/user';
import type { QueryOrder, QueryPeriod } from '@/domain/enums/queries';
import type { PatientsStatisticField } from '@/domain/enums/statistics';
import { getDateRangeForPeriod } from '@/utils/get-date-range-for-period';

import { GetTotalPatientsUseCase } from './get-total-patients.use-case';

interface GetTotalPatientsByFieldUseCaseInput {
  field: PatientsStatisticField;
  period?: QueryPeriod;
  startDate?: Date;
  endDate?: Date;
  order?: QueryOrder;
  limit?: number;
  withPercentage?: boolean;
}

interface GetTotalPatientsByFieldUseCaseOutput<T> {
  items: T[];
  total: number;
}

const FIELD_COLUMN_MAP: Record<PatientsStatisticField, string> = {
  gender: 'survey.gender',
  state: 'survey.addressState',
};

@Injectable()
export class GetTotalPatientsByFieldUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly getTotalPatientsUseCase: GetTotalPatientsUseCase,
  ) {}

  async execute<T>({
    field,
    period,
    startDate,
    endDate,
    order,
    limit,
    withPercentage,
  }: GetTotalPatientsByFieldUseCaseInput): Promise<
    GetTotalPatientsByFieldUseCaseOutput<T>
  > {
    const dateRange = period
      ? getDateRangeForPeriod(period)
      : { startDate, endDate };

    const totalPatients = await this.getTotalPatientsUseCase.execute({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });

    const column = FIELD_COLUMN_MAP[field];

    const createBaseQuery = (): SelectQueryBuilder<User> => {
      const baseQuery = this.usersRepository
        .createQueryBuilder('user')
        .innerJoin('user.survey', 'survey')
        .where('user.status != :status', { status: 'pending' });

      if (dateRange.startDate && dateRange.endDate) {
        baseQuery.andWhere('user.created_at BETWEEN :start AND :end', {
          start: dateRange.startDate,
          end: dateRange.endDate,
        });
      }

      return baseQuery;
    };

    const totalQuery = createBaseQuery().select(
      `COUNT(DISTINCT ${column})`,
      'total',
    );

    const fieldQuery = createBaseQuery()
      .select(`${column}`, field)
      .addSelect('COUNT(user.id)', 'total')
      .groupBy(`${column}`)
      .orderBy('total', order);

    if (withPercentage) {
      fieldQuery.addSelect(
        `ROUND((COUNT(user.id) * 100.0 / ${totalPatients}), 1)`,
        'percentage',
      );
    }

    const [items, totalResult] = await Promise.all([
      fieldQuery.getRawMany<T>(),
      totalQuery.getRawOne<{ total: string }>(),
    ]);

    return {
      items: (items as Record<string, unknown>[])
        .slice(0, limit)
        .map((item) => {
          const baseData = { ...item, total: Number(item.total) || 0 };

          if (withPercentage) {
            return { ...baseData, percentage: Number(item.percentage) || 0 };
          }

          return baseData;
        }) as T[],
      total: Number(totalResult?.total) || 0,
    };
  }
}
