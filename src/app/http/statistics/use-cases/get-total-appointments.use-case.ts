import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  type FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  type Repository,
} from 'typeorm';

import { Appointment } from '@/domain/entities/appointment';
import type { AppointmentStatus } from '@/domain/enums/appointments';
import type { PatientCondition } from '@/domain/enums/patients';
import type { QueryPeriod } from '@/domain/enums/queries';
import type { SpecialtyCategory } from '@/domain/enums/shared';
import { getDateRangeForPeriod } from '@/utils/get-date-range-for-period';

interface GetTotalAppointmentsUseCaseInput {
  patientId?: string;
  status?: AppointmentStatus;
  category?: SpecialtyCategory;
  condition?: PatientCondition;
  period?: QueryPeriod;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class GetTotalAppointmentsUseCase {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  async execute({
    patientId,
    status,
    category,
    condition,
    period,
    startDate,
    endDate,
  }: GetTotalAppointmentsUseCaseInput = {}): Promise<number> {
    const dateRange = period
      ? getDateRangeForPeriod(period)
      : { startDate, endDate };

    const where: FindOptionsWhere<Appointment> = {};

    if (dateRange.startDate && dateRange.endDate) {
      where.date = Between(dateRange.startDate, dateRange.endDate);
    }

    if (dateRange.startDate && !dateRange.endDate) {
      where.date = MoreThanOrEqual(dateRange.startDate);
    }

    if (dateRange.endDate && !dateRange.startDate) {
      where.date = LessThanOrEqual(dateRange.endDate);
    }

    if (patientId) {
      where.patient = { id: patientId };
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (condition) {
      where.condition = condition;
    }

    return await this.appointmentsRepository.count({
      select: { id: true },
      where,
    });
  }
}
