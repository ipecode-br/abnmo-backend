import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';

import { User } from '@/domain/entities/user';
import type { QueryPeriod } from '@/domain/enums/queries';
import { PatientWithAppointmentsField } from '@/domain/enums/statistics';
import { getDateRangeForPeriod } from '@/utils/get-date-range-for-period';

interface GetTotalPatientsWithAppointmentsByFieldUseCaseInput {
  field: PatientWithAppointmentsField;
  period?: QueryPeriod;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

interface GetTotalPatientsWithAppointmentsByFieldUseCaseOutput<T> {
  list: T[];
  total: number;
}

@Injectable()
export class GetTotalPatientsWithAppointmentsByFieldUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async execute<T>({
    field,
    period,
    startDate,
    endDate,
    limit,
  }: GetTotalPatientsWithAppointmentsByFieldUseCaseInput): Promise<
    GetTotalPatientsWithAppointmentsByFieldUseCaseOutput<T>
  > {
    const FIELD_MAPPING: Record<PatientWithAppointmentsField, string> = {
      state: 'survey.addressState',
    };

    const column = FIELD_MAPPING[field];

    const dateRange = period
      ? getDateRangeForPeriod(period)
      : { startDate, endDate };

    const createBaseQuery = (): SelectQueryBuilder<User> => {
      const baseQuery = this.usersRepository
        .createQueryBuilder('user')
        .innerJoin(
          'appointments',
          'appointment',
          'appointment.patient.id = user.id',
        )
        .innerJoin('user.survey', 'survey')
        .where('user.status != :status', { status: 'pending' });

      if (dateRange.startDate && dateRange.endDate) {
        baseQuery.andWhere('appointment.date BETWEEN :start AND :end', {
          start: dateRange.startDate,
          end: dateRange.endDate,
        });
      }

      return baseQuery;
    };

    const listQuery = createBaseQuery()
      .select(column, field)
      .addSelect('COUNT(DISTINCT user.id)', 'total')
      .addSelect(
        `ROUND(
          (COUNT(DISTINCT user.id) / SUM(COUNT(DISTINCT user.id)) OVER()) * 100,
          1
        )`,
        'percentage',
      )
      .groupBy(column)
      .orderBy('COUNT(DISTINCT user.id)', 'DESC')
      .limit(limit);

    const totalQuery = createBaseQuery().select(
      `COUNT(DISTINCT ${column})`,
      'total',
    );

    const [list, totalResult] = await Promise.all([
      listQuery.getRawMany<Record<string, unknown>>(),
      totalQuery.getRawOne<{ total: string }>(),
    ]);

    const totalList = Number(totalResult?.total || 0);

    return {
      list: list.map((item) => ({
        ...item,
        total: Number(item.total) || 0,
        percentage: Number(item.percentage) || 0,
      })) as T[],
      total: totalList,
    };
  }
}
