import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  type FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  type Repository,
} from 'typeorm';

import { can } from '@/common/authorization/can';
import type { RequestUser } from '@/common/types';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import type { QueryPeriod } from '@/domain/enums/queries';
import type { SurveySubmissionStatus } from '@/domain/enums/survey-submissions';
import { getDateRangeForPeriod } from '@/utils/get-date-range-for-period';

interface GetTotalSurveySubmissionsUseCaseInput {
  user: RequestUser;
  status?: SurveySubmissionStatus;
  period?: QueryPeriod;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class GetTotalSurveySubmissionsUseCase {
  constructor(
    @InjectRepository(SurveySubmission)
    private readonly surveySubmissionRepository: Repository<SurveySubmission>,
  ) {}

  async execute({
    user,
    status,
    period,
    startDate,
    endDate,
  }: GetTotalSurveySubmissionsUseCaseInput): Promise<number> {
    can(user, 'read:survey:others');

    const where: FindOptionsWhere<SurveySubmission> = {};

    if (status) {
      where.status = status;
    }

    if (period) {
      const dateRange = getDateRangeForPeriod(period);
      where.createdAt = Between(dateRange.startDate, dateRange.endDate);
    }

    if (startDate && !endDate) {
      where.createdAt = MoreThanOrEqual(new Date(startDate));
    }

    if (endDate && !startDate) {
      where.createdAt = LessThanOrEqual(new Date(endDate));
    }

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    return await this.surveySubmissionRepository.count({
      select: { id: true },
      where,
    });
  }
}
