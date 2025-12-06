import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  type FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';

import { Referral } from '@/domain/entities/referral';
import { ReferralStatus } from '@/domain/schemas/referral';

import { CreateReferralDto } from './referrals.dtos';

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
      status: ReferralStatus;
      referred_by: string;
    },
  ): Promise<Referral> {
    const referrals = this.referralsRepository.create(createReferralDto);
    return await this.referralsRepository.save(referrals);
  }

  public async cancel(id: string): Promise<Referral> {
    return await this.referralsRepository.save({ id, status: 'canceled' });
  }

  public async getTotalReferrals(
    input: {
      status?: ReferralStatus;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<number> {
    const { status, startDate, endDate } = input;

    const where: FindOptionsWhere<Referral> = {};

    if (status) {
      where.status = status;
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

    return await this.referralsRepository.count({ where });
  }
}
