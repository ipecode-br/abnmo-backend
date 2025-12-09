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

import { Referral } from '@/domain/entities/referral';
import type { ReferralOrderBy } from '@/domain/enums/referrals';
import type { GetReferralsResponseSchema } from '@/domain/schemas/referral/responses';

import { GetReferralsQuery } from '../referrals.dtos';

interface GetReferralsUseCaseRequest {
  query: GetReferralsQuery;
}

type GetReferralsUseCaseResponse = Promise<GetReferralsResponseSchema['data']>;

@Injectable()
export class GetReferralsUseCase {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
  ) {}

  async execute({
    query,
  }: GetReferralsUseCaseRequest): GetReferralsUseCaseResponse {
    const { search, status, category, condition, page, perPage } = query;

    const ORDER_BY_MAPPING: Record<ReferralOrderBy, keyof Referral> = {
      date: 'created_at',
      patient: 'patient',
      status: 'status',
      category: 'category',
      condition: 'condition',
      professional: 'professional_name',
    };

    const where: FindOptionsWhere<Referral> = {};
    const startDate = query.startDate ? new Date(query.startDate) : null;
    const endDate = query.endDate ? new Date(query.endDate) : null;

    if (status) {
      where.status = status;
    }

    if (condition) {
      where.condition = condition;
    }

    if (category) {
      where.category = category;
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

    if (search) {
      where.patient = { user: { name: ILike(`%${search}%`) } };
    }

    const total = await this.referralsRepository.count({ where });

    const orderBy = ORDER_BY_MAPPING[query.orderBy];
    const order =
      orderBy === 'patient'
        ? { patient: { user: { name: query.order } } }
        : { [orderBy]: query.order };

    const referralsQuery = await this.referralsRepository.find({
      relations: { patient: { user: true } },
      select: {
        patient: {
          id: true,
          user: { name: true, avatar_url: true },
        },
      },
      skip: (page - 1) * perPage,
      take: perPage,
      order,
      where,
    });

    const referrals = referralsQuery.map((referral) => ({
      id: referral.id,
      patient_id: referral.patient_id,
      date: referral.date,
      status: referral.status,
      category: referral.category,
      condition: referral.condition,
      annotation: referral.annotation,
      professional_name: referral.professional_name,
      created_by: referral.created_by,
      created_at: referral.created_at,
      updated_at: referral.updated_at,
      patient: {
        name: referral.patient.user.name,
        email: referral.patient.user.email,
        avatar_url: referral.patient.user.avatar_url,
      },
    }));

    return { referrals, total };
  }
}
