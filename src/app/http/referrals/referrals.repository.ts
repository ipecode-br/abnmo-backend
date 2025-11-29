import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Referral } from '@/domain/entities/referral';
import { ReferralStatusType } from '@/domain/schemas/referral';

import { CreateReferralDto } from './referrals.dtos';

@Injectable()
export class ReferralsRepository {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
  ) {}

  public async create(
    createReferralDto: CreateReferralDto & {
      status: ReferralStatusType;
      referred_by: string;
    },
  ): Promise<Referral> {
    const referrals = this.referralsRepository.create(createReferralDto);
    return await this.referralsRepository.save(referrals);
  }
}
