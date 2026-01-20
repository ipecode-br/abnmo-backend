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
import type { ReferralResponse } from '@/domain/schemas/referrals/responses';

import { GetReferralsQuery } from '../referrals.dtos';

interface GetReferralsUseCaseInput {
  query: GetReferralsQuery;
}

interface GetReferralsUseCaseOutput {
  referrals: ReferralResponse[];
  total: number;
}

@Injectable()
export class GetReferralsUseCase {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
  ) {}

  async execute({
    query,
  }: GetReferralsUseCaseInput): Promise<GetReferralsUseCaseOutput> {
    const { search, status, category, condition, page, perPage } = query;
    const startDate = query.startDate ? new Date(query.startDate) : null;
    const endDate = query.endDate ? new Date(query.endDate) : null;

    const ORDER_BY_MAPPING: Record<ReferralOrderBy, keyof Referral> = {
      date: 'created_at',
      patient: 'patient',
      status: 'status',
      category: 'category',
      condition: 'condition',
      professional: 'professional_name',
    };

    const where: FindOptionsWhere<Referral> = {};

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
      where.created_at = MoreThanOrEqual(startDate);
    }

    if (endDate && !startDate) {
      where.created_at = LessThanOrEqual(endDate);
    }

    if (startDate && endDate) {
      where.created_at = Between(startDate, endDate);
    }

    if (search) {
      where.patient = { name: ILike(`%${search}%`) };
    }

    const total = await this.referralsRepository.count({ where });

    const orderBy = ORDER_BY_MAPPING[query.orderBy];
    const order =
      orderBy === 'patient'
        ? { patient: { name: query.order } }
        : { [orderBy]: query.order };

    const referrals = await this.referralsRepository.find({
      select: { patient: { id: true, name: true, avatar_url: true } },
      relations: { patient: true },
      skip: (page - 1) * perPage,
      take: perPage,
      order,
      where,
    });

    return { referrals, total };
  }
}
