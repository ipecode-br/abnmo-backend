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

import { SurveySubmission } from '@/domain/entities/survey-submission';
import { QueryOrder } from '@/domain/enums/queries';
import type {
  SurveySubmissionOrderBy,
  SurveySubmissionStatus,
} from '@/domain/enums/surveys';
import { SurveySubmissionResponse } from '@/domain/schemas/surveys/responses';

interface GetSurveySubmissionsUseCaseInput {
  page: number;
  perPage: number;
  search?: string;
  order?: QueryOrder;
  orderBy?: SurveySubmissionOrderBy;
  status?: SurveySubmissionStatus;
  startDate?: string;
  endDate?: string;
}

interface GetSurveySubmissionsUseCaseOutput {
  submissions: SurveySubmissionResponse[];
  total: number;
}

@Injectable()
export class GetSurveySubmissionsUseCase {
  constructor(
    @InjectRepository(SurveySubmission)
    private readonly surveySubmissionRepository: Repository<SurveySubmission>,
  ) {}

  async execute({
    search,
    status,
    page,
    perPage,
    ...props
  }: GetSurveySubmissionsUseCaseInput): Promise<GetSurveySubmissionsUseCaseOutput> {
    const startDate = props.startDate ? new Date(props.startDate) : null;
    const endDate = props.endDate ? new Date(props.endDate) : null;

    const ORDER_BY_MAPPING: Record<
      SurveySubmissionOrderBy,
      keyof SurveySubmission
    > = {
      name: 'name',
      email: 'email',
      status: 'status',
      date: 'createdAt',
    };

    const where: FindOptionsWhere<SurveySubmission> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.name = ILike(`%${search}%`);
      where.email = ILike(`%${search}%`);
    }

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    if (startDate && !endDate) {
      where.createdAt = MoreThanOrEqual(startDate);
    }

    if (endDate && !startDate) {
      where.createdAt = LessThanOrEqual(endDate);
    }

    const total = await this.surveySubmissionRepository.count({ where });

    const orderBy = ORDER_BY_MAPPING[props.orderBy || 'date'];

    const result = await this.surveySubmissionRepository.find({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
      order: { [orderBy]: props.order },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      submissions: result.map((submission) => ({
        id: submission.id,
        name: submission.name,
        email: submission.email,
        phone: submission.phone,
        status: submission.status,
        createdAt: submission.createdAt,
      })),
      total,
    };
  }
}
