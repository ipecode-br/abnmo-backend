import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';

import { Appointment } from '@/domain/entities/appointment';
import type { QueryPeriod } from '@/domain/enums/queries';
import { getDateRangeForPeriod } from '@/utils/get-date-range-for-period';

interface GetTotalPatientsWithAppointmentsUseCaseInput {
  period?: QueryPeriod;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class GetTotalPatientsWithAppointmentsUseCase {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  async execute({
    period,
    startDate,
    endDate,
  }: GetTotalPatientsWithAppointmentsUseCaseInput = {}): Promise<number> {
    const dateRange = period
      ? getDateRangeForPeriod(period)
      : { startDate, endDate };

    const query = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .innerJoin('appointment.patient', 'user')
      .innerJoin('user.survey', 'survey')
      .where('user.status != :status', { status: 'pending' });

    if (dateRange.startDate && dateRange.endDate) {
      query.andWhere('appointment.date BETWEEN :start AND :end', {
        start: dateRange.startDate,
        end: dateRange.endDate,
      });
    }

    if (dateRange.startDate && !dateRange.endDate) {
      query.andWhere('appointment.date >= :startDate', {
        startDate: dateRange.startDate,
      });
    }

    if (dateRange.endDate && !dateRange.startDate) {
      query.andWhere('appointment.date <= :endDate', {
        endDate: dateRange.endDate,
      });
    }

    query.select('COUNT(DISTINCT appointment.patient.id)', 'count');

    const result = await query.getRawOne<{ count: string }>();

    return Number(result?.count) || 0;
  }
}
