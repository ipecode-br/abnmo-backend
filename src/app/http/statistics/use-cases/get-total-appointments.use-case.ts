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
import { UtilsService } from '@/utils/utils.service';

interface GetTotalAppointmentsUseCaseInput {
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
    private readonly utilsService: UtilsService,
  ) {}

  async execute({
    status,
    category,
    condition,
    period,
    startDate,
    endDate,
  }: GetTotalAppointmentsUseCaseInput = {}): Promise<number> {
    const where: FindOptionsWhere<Appointment> = {};

    if (period) {
      const dateRange = this.utilsService.getDateRangeForPeriod(period);
      where.created_at = Between(dateRange.startDate, dateRange.endDate);
    }

    if (startDate && !endDate) {
      where.created_at = MoreThanOrEqual(startDate);
    }

    if (endDate && !startDate) {
      where.created_at = LessThanOrEqual(endDate);
    }

    if (startDate && endDate) {
      where.created_at = Between(startDate, endDate);
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
