import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(GetTotalAppointmentsUseCase.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    private readonly utilsService: UtilsService,
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
    const startTime = Date.now();

    const where: FindOptionsWhere<Appointment> = {};

    if (period) {
      const dateRange = this.utilsService.getDateRangeForPeriod(period);
      where.date = Between(dateRange.startDate, dateRange.endDate);
    }

    if (startDate && !endDate) {
      where.date = MoreThanOrEqual(startDate);
    }

    if (endDate && !startDate) {
      where.date = LessThanOrEqual(endDate);
    }

    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }

    if (patientId) {
      where.patient_id = patientId;
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

    const result = await this.appointmentsRepository.count({
      select: { id: true },
      where,
    });

    const endTime = Date.now();
    const ms = endTime - startTime;

    this.logger.log(
      {
        patientId,
        status,
        category,
        condition,
        period,
        startDate,
        endDate,
        ms,
      },
      'Appointments total returned successfully',
    );

    return result;
  }
}
