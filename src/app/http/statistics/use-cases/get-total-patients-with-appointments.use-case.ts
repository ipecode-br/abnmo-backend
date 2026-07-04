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
    const query = this.appointmentsRepository
      .createQueryBuilder('a')
      .innerJoin('a.patient', 'patient')
      .innerJoin('patient.survey', 'survey')
      .andWhere('patient.status != :status', { status: 'pending' });

    if (period) {
      const dateRange = getDateRangeForPeriod(period);
      query.andWhere('a.createdAt BETWEEN :start AND :end', {
        start: dateRange.startDate,
        end: dateRange.endDate,
      });
    }

    if (startDate && !endDate) {
      query.andWhere('a.createdAt >= :startDate', { startDate });
    }

    if (endDate && !startDate) {
      query.andWhere('a.createdAt <= :endDate', { endDate });
    }

    if (startDate && endDate) {
      query.andWhere('a.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
    }

    query.select('COUNT(DISTINCT a.patient_id)', 'count');

    const result = await query.getRawOne<{ count: string }>();

    return Number(result?.count) || 0;
  }
}
