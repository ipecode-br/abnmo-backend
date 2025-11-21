import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Referral } from '@/domain/entities/referral';

@Injectable()
export class ReferralsRepository {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
  ) {}

  public async findById(id: string): Promise<Referral | null> {
    return await this.referralsRepository.findOne({ where: { id } });
  }

  public async cancel(id: string): Promise<Referral> {
    return await this.referralsRepository.save({ id, status: 'canceled' });
  }
}
