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
import type { GetReferralsResponseSchema } from '@/domain/schemas/referral';

import { GetReferralsQuery } from '../referrals.dtos';

interface GetReferralsUseCaseRequest {
  query: GetReferralsQuery;
}

type GetReferralsUseCaseRequestResponse = Promise<
  GetReferralsResponseSchema['data']
>;

@Injectable()
export class GetReferralsUseCase {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
  ) {}

  async execute({
    query,
  }: GetReferralsUseCaseRequest): GetReferralsUseCaseRequestResponse {
    const { orderBy, page, perPage, category, condition, order, search } =
      query;

    const where: FindOptionsWhere<Referral> = {};
    const startDate = query.startDate ? new Date(query.startDate) : null;
    const endDate = query.endDate ? new Date(query.endDate) : null;

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

    const totalQuery = await this.referralsRepository.count({ where });

    const referralsQuery = await this.referralsRepository.find({
      relations: { patient: { user: true } },
      select: {
        patient: {
          id: true,
          user: { name: true, avatar_url: true },
        },
      },
      order: { [orderBy]: order },
      take: perPage,
      skip: (page - 1) * perPage,
      where,
    });

    const referrals = referralsQuery.map((referral) => ({
      id: referral.id,
      date: referral.date,
      category: referral.category,
      condition: referral.condition,
      annotation: referral.annotation,
      status: referral.status,
      referred_to: referral.referred_to,
      created_at: referral.created_at,
      patient: {
        id: referral.patient.id,
        name: referral.patient.user.name,
        avatar_url: referral.patient.user.avatar_url,
      },
    }));

    return { referrals, total: totalQuery };
  }
}
