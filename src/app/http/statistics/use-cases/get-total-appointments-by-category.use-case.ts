import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';

import { Appointment } from '@/domain/entities/appointment';
import type { QueryPeriod } from '@/domain/enums/queries';
import type { TotalAppointmentsByCategory } from '@/domain/schemas/statistics/responses';
import { getDateRangeForPeriod } from '@/utils/get-date-range-for-period';

interface GetTotalAppointmentsByCategoryUseCaseInput {
  patientId?: string;
  period?: QueryPeriod;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

interface GetTotalAppointmentsByCategoryUseCaseOutput {
  categories: TotalAppointmentsByCategory[];
  total: number;
}

@Injectable()
export class GetTotalAppointmentsByCategoryUseCase {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  async execute({
    patientId,
    period,
    startDate,
    endDate,
    limit,
  }: GetTotalAppointmentsByCategoryUseCaseInput = {}): Promise<GetTotalAppointmentsByCategoryUseCaseOutput> {
    const dateRange = period
      ? getDateRangeForPeriod(period)
      : { startDate, endDate };

    const createBaseQuery = (): SelectQueryBuilder<Appointment> => {
      const baseQuery =
        this.appointmentsRepository.createQueryBuilder('appointment');

      if (dateRange.startDate && dateRange.endDate) {
        baseQuery.where('appointment.date BETWEEN :start AND :end', {
          start: dateRange.startDate,
          end: dateRange.endDate,
        });
      }

      if (patientId) {
        baseQuery.andWhere('appointment.patient_id = :patientId', {
          patientId,
        });
      }

      return baseQuery;
    };

    const listCategoriesQuery = createBaseQuery()
      .select('appointment.category', 'category')
      .addSelect('COUNT(appointment.id)', 'total')
      .groupBy('appointment.category')
      .orderBy('COUNT(appointment.id)', 'DESC')
      .limit(limit);

    const totalQuery = createBaseQuery().select(
      'COUNT(DISTINCT appointment.category)',
      'total',
    );

    const [categories, totalResult] = await Promise.all([
      listCategoriesQuery.getRawMany<TotalAppointmentsByCategory>(),
      totalQuery.getRawOne<{ total: string }>(),
    ]);

    return { categories, total: Number(totalResult?.total || 0) };
  }
}
