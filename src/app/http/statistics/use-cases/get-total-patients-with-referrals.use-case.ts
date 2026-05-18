import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  type FindOptionsWhere,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  type Repository,
} from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import type { QueryPeriod } from '@/domain/enums/queries';
import { getDateRangeForPeriod } from '@/utils/get-date-range-for-period';

interface GetTotalPatientsWithReferralsUseCaseInput {
  period?: QueryPeriod;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class GetTotalPatientsWithReferralsUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  async execute({
    period,
    startDate,
    endDate,
  }: GetTotalPatientsWithReferralsUseCaseInput = {}): Promise<number> {
    const where: FindOptionsWhere<Patient> = {
      referrals: { id: Not(IsNull()) },
    };

    if (period) {
      const dateRange = getDateRangeForPeriod(period);
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
    return await this.patientsRepository.count({ where });
  }
}
