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

import { can } from '@/common/authorization/can';
import type { RequestUser } from '@/common/types';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';
import { QueryOrder } from '@/domain/enums/queries';
import type {
  SurveySubmissionOrderBy,
  SurveySubmissionStatus,
} from '@/domain/enums/survey-submissions';
import { SurveySubmissionResponse } from '@/domain/schemas/surveys/submissions/responses';

interface GetSurveySubmissionsUseCaseInput {
  user: RequestUser;
  page: number;
  perPage: number;
  search?: string;
  order?: QueryOrder;
  orderBy?: SurveySubmissionOrderBy;
  status?: SurveySubmissionStatus;
  startDate?: Date;
  endDate?: Date;
}

interface GetSurveySubmissionsUseCaseOutput {
  submissions: SurveySubmissionResponse[];
  total: number;
}

@Injectable()
export class GetSurveySubmissionsUseCase {
  constructor(
    @InjectRepository(SurveySubmission)
    private readonly surveySubmissionsRepository: Repository<SurveySubmission>,
  ) {}

  async execute({
    user,
    search,
    status,
    page,
    perPage,
    startDate,
    endDate,
    ...props
  }: GetSurveySubmissionsUseCaseInput): Promise<GetSurveySubmissionsUseCaseOutput> {
    can(user, 'read:survey:others');

    const ORDER_BY_MAPPING: Record<
      SurveySubmissionOrderBy,
      keyof SurveySubmission | keyof User
    > = {
      name: 'name',
      email: 'email',
      status: 'status',
      date: 'createdAt',
    };
    const orderBy = ORDER_BY_MAPPING[props.orderBy || 'date'];
    const shouldOrderByUser = orderBy === 'name' || orderBy === 'email';
    const order = shouldOrderByUser
      ? { patient: { [orderBy]: props.order } }
      : { [orderBy]: props.order };

    const where: FindOptionsWhere<SurveySubmission> = {};

    if (status) {
      where.status = status;
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

    if (search) {
      where.patient = { name: ILike(`%${search}%`) };
    }

    const total = await this.surveySubmissionsRepository.count({
      relations: { patient: true },
      where,
    });

    const result = await this.surveySubmissionsRepository.find({
      relations: { patient: true, document: true },
      select: {
        id: true,
        status: true,
        reason: true,
        createdAt: true,
        patient: { id: true, name: true, email: true, phone: true },
        document: { name: true, url: true },
      },
      skip: (page - 1) * perPage,
      take: perPage,
      order,
      where,
    });

    return {
      submissions: result.map((submission) => ({
        id: submission.id,
        name: submission.patient.name,
        email: submission.patient.email,
        phone: submission.patient.phone || '',
        status: submission.status,
        reason: submission.reason,
        createdAt: submission.createdAt,
        document: submission.document
          ? { name: submission.document.name, url: submission.document.url }
          : null,
      })),
      total,
    };
  }
}
