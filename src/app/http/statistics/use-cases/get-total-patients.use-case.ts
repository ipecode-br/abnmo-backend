import { Injectable } from '@nestjs/common';
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
    const where: FindOptionsWhere<Patient> = {
      status: status ?? Not('pending'),
    };

    if (period) {
      const dateRange = this.utilsService.getDateRangeForPeriod(period);
      where.createdAt = Between(dateRange.startDate, dateRange.endDate);
    }

    if (startDate && !endDate) {
      where.createdAt = MoreThanOrEqual(startDate);
    }

    if (endDate && !startDate) {
      where.createdAt = LessThanOrEqual(endDate);
    }

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }
    return await this.patientsRepository.count({ select: { id: true }, where });
  }
}
