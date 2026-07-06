import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  type FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  type Repository,
} from 'typeorm';

import { Survey } from '@/domain/entities/survey';
import type { QueryOrder, QueryPeriod } from '@/domain/enums/queries';
import type { SurveysOrderBy, SurveyStatus } from '@/domain/enums/surveys';
import type { ListSurveyResponse } from '@/domain/schemas/surveys/responses';
import { getDateRangeForPeriod } from '@/utils/get-date-range-for-period';

interface GetSurveysUseCaseInput {
  page: number;
  perPage: number;
  search?: string;
  status?: SurveyStatus;
  period?: QueryPeriod;
  startDate?: string;
  endDate?: string;
  order?: QueryOrder;
  orderBy?: SurveysOrderBy;
}

interface GetSurveysUseCaseOutput {
  surveys: ListSurveyResponse[];
  total: number;
}

const ORDER_BY_MAPPING: Record<SurveysOrderBy, keyof Survey> = {
  status: 'status',
  date: 'createdAt',
};

@Injectable()
export class GetSurveysUseCase {
  constructor(
    @InjectRepository(Survey)
    private readonly surveysRepository: Repository<Survey>,
  ) {}

  async execute({
    search,
    status,
    period,
    page,
    perPage,
    ...props
  }: GetSurveysUseCaseInput): Promise<GetSurveysUseCaseOutput> {
    const startDate = props.startDate ? new Date(props.startDate) : null;
    const endDate = props.endDate ? new Date(props.endDate) : null;
    const orderBy = ORDER_BY_MAPPING[props.orderBy || 'date'];

    const where: FindOptionsWhere<Survey> = {};

    if (status) {
      where.status = status;
    }

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

    if (search) {
      where.user = { name: ILike(`%${search}%`) };
    }

    const total = await this.surveysRepository.count({
      relations: { user: true },
      where,
    });

    const surveys = await this.surveysRepository.find({
      relations: { user: true },
      where,
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: { name: true, phone: true, email: true },
      },
      order: { [orderBy]: props.order },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      surveys: surveys.map((survey) => ({
        id: survey.id,
        name: survey.user.name,
        phone: survey.user.phone || '',
        email: survey.user.email,
        status: survey.status,
        createdAt: survey.createdAt,
      })),
      total,
    };
  }
}
