import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Referral } from '@/domain/entities/referral';
import { ReferralStatus } from '@/domain/schemas/referral';

import { CreateReferralsDto } from './referrals.dtos';

@Injectable()
export class ReferralsRepository {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
  ) {}
  public async create(
    createReferralsDto: CreateReferralsDto & {
      status: ReferralStatus;
      referred_by: string;
    },
  ): Promise<Referral> {
    const referrals = this.referralsRepository.create(createReferralsDto);
    return await this.referralsRepository.save(referrals);
  }
}
