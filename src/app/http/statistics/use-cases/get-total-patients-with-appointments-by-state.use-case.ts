import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';

import { User } from '@/domain/entities/user';
import type { QueryPeriod } from '@/domain/enums/queries';
import type { TotalPatientsWithAppointmentsByState } from '@/domain/schemas/statistics/responses';
import { getDateRangeForPeriod } from '@/utils/get-date-range-for-period';

interface GetTotalPatientsWithAppointmentsByStateUseCaseInput {
  period?: QueryPeriod;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

interface GetTotalPatientsWithAppointmentsByStateUseCaseOutput {
  states: TotalPatientsWithAppointmentsByState[];
  total: number;
}

@Injectable()
export class GetTotalPatientsWithAppointmentsByStateUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async execute({
    period,
    startDate,
    endDate,
    limit,
  }: GetTotalPatientsWithAppointmentsByStateUseCaseInput = {}): Promise<GetTotalPatientsWithAppointmentsByStateUseCaseOutput> {
    const dateRange = period
      ? getDateRangeForPeriod(period)
      : { startDate, endDate };

    const createBaseQuery = (): SelectQueryBuilder<User> => {
      const baseQuery = this.usersRepository
        .createQueryBuilder('user')
        .innerJoin(
          'appointments',
          'appointment',
          'appointment.patient_id = user.id',
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

    const listStatesQuery = createBaseQuery()
      .select('survey.addressState', 'state')
      .addSelect('COUNT(DISTINCT user.id)', 'total');

    listStatesQuery
      .addSelect(
        `ROUND(
          (COUNT(DISTINCT user.id) / SUM(COUNT(DISTINCT user.id)) OVER()) * 100,
          1
        )`,
        'percentage',
      )
      .groupBy('survey.addressState')
      .orderBy('COUNT(DISTINCT user.id)', 'DESC')
      .limit(limit);

    const totalQuery = createBaseQuery().select(
      'COUNT(DISTINCT survey.addressState)',
      'total',
    );

    const [states, totalResult] = await Promise.all([
      listStatesQuery.getRawMany<TotalPatientsWithAppointmentsByState>(),
      totalQuery.getRawOne<{ total: string }>(),
    ]);

    const totalPatients = Number(totalResult?.total || 0);

    return {
      states: states.map((state) => ({
        ...state,
        total: Number(state.total) || 0,
        percentage: Number(state.percentage) || 0,
      })),
      total: totalPatients,
    };
  }
}
