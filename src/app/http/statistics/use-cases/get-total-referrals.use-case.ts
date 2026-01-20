import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  type FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  type Repository,
} from 'typeorm';

import { Referral } from '@/domain/entities/referral';
import type { PatientCondition } from '@/domain/enums/patients';
import type { QueryPeriod } from '@/domain/enums/queries';
import type { ReferralStatus } from '@/domain/enums/referrals';
import type { SpecialtyCategory } from '@/domain/enums/shared';
import { UtilsService } from '@/utils/utils.service';

interface GetTotalReferralsUseCaseInput {
  status?: ReferralStatus;
  category?: SpecialtyCategory;
  condition?: PatientCondition;
  period?: QueryPeriod;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class GetTotalReferralsUseCase {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
    private readonly utilsService: UtilsService,
  ) {}

  async execute({
    status,
    category,
    condition,
    period,
    startDate,
    endDate,
  }: GetTotalReferralsUseCaseInput = {}): Promise<number> {
    const where: FindOptionsWhere<Referral> = {};

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

    return await this.referralsRepository.count({
      select: { id: true },
      where,
    });
  }
}
