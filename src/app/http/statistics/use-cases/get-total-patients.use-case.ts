import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  type FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  type Repository,
} from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import type { PatientStatus } from '@/domain/enums/patients';
import type { QueryPeriod } from '@/domain/enums/queries';
import { UtilsService } from '@/utils/utils.service';

interface GetTotalPatientsUseCaseInput {
  status?: PatientStatus;
  period?: QueryPeriod;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class GetTotalPatientsUseCase {
  private readonly logger = new Logger(GetTotalPatientsUseCase.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly utilsService: UtilsService,
  ) {}

  async execute({
    status,
    period,
    startDate,
    endDate,
  }: GetTotalPatientsUseCaseInput = {}): Promise<number> {
    const startTime = Date.now();

    const where: FindOptionsWhere<Patient> = {
      status: status ?? Not('pending'),
    };

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

    const result = await this.patientsRepository.count({
      select: { id: true },
      where,
    });

    const endTime = Date.now();
    const ms = endTime - startTime;

    this.logger.log(
      { status, period, startDate, endDate, ms },
      'Patients total returned successfully',
    );

    return result;
  }
}
