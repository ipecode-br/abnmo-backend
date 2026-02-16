import { Injectable, Logger } from '@nestjs/common';
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
  patientId?: string;
  status?: ReferralStatus;
  category?: SpecialtyCategory;
  condition?: PatientCondition;
  period?: QueryPeriod;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class GetTotalReferralsUseCase {
  private readonly logger = new Logger(GetTotalReferralsUseCase.name);

  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
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
  }: GetTotalReferralsUseCaseInput = {}): Promise<number> {
    const startTime = Date.now();

    const where: FindOptionsWhere<Referral> = {};

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

    const result = await this.referralsRepository.count({
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
      'Referrals total returned successfully',
    );

    return result;
  }
}
