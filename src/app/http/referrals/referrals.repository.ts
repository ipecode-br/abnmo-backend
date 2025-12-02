import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Referral } from '@/domain/entities/referral';
import {
  ReferralFieldType,
  ReferralStatusType,
} from '@/domain/schemas/referral';

import { CreateReferralDto, GetReferralByPeriodDto } from './referrals.dtos';

@Injectable()
export class ReferralsRepository {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
  ) {}

  public async findById(id: string): Promise<Referral | null> {
    return await this.referralsRepository.findOne({ where: { id } });
  }

  public async create(
    createReferralDto: CreateReferralDto & {
      status: ReferralStatusType;
      referred_by: string;
    },
  ): Promise<Referral> {
    const referrals = this.referralsRepository.create(createReferralDto);
    return await this.referralsRepository.save(referrals);
  }

  async getReferralsByPeriod<T>(
    field: ReferralFieldType,
    startDate: Date,
    endDate: Date,
    query: GetReferralByPeriodDto,
  ): Promise<{ items: T[]; total: number }> {
    const totalQuery = this.referralsRepository
      .createQueryBuilder('referral')
      .select(`COUNT(DISTINCT referral.${field})`, 'total')
      .where('referral.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });

    const totalResult = await totalQuery.getRawOne<{ total: string }>();
    const total = Number(totalResult?.total ?? 0);

    const queryBuilder = this.referralsRepository
      .createQueryBuilder('referral')
      .select(`referral.${field}`, field)
      .addSelect('COUNT(*)', 'total')
      .where('referral.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy(`referral.${field}`)
      .orderBy('total', query.order)
      .limit(query.limit);

    if (query.withPercentage) {
      queryBuilder.addSelect(
        'ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 1)',
        'percentage',
      );
    }

    const items = await queryBuilder.getRawMany<T>();

    return { items, total };
  }

  public async cancel(id: string): Promise<Referral> {
    return await this.referralsRepository.save({ id, status: 'canceled' });
  }
}
