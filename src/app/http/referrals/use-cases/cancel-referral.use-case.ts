import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Referral } from '@/domain/entities/referral';

interface CancelReferralUseCaseRequest {
  id: string;
  userId: string;
}

type CancelReferralUseCaseResponse = Promise<void>;

@Injectable()
export class CancelReferralUseCase {
  private readonly logger = new Logger(CancelReferralUseCase.name);

  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
  ) {}

  async execute({
    id,
    userId,
  }: CancelReferralUseCaseRequest): CancelReferralUseCaseResponse {
    const referral = await this.referralsRepository.findOne({
      select: { id: true, status: true },
      where: { id },
    });

    if (!referral) {
      throw new NotFoundException('Encaminhamento não encontrado.');
    }

    if (referral.status === 'canceled') {
      throw new BadRequestException('Este encaminhamento já está cancelado.');
    }

    await this.referralsRepository.save({ id, status: 'canceled' });

    this.logger.log({ id, userId }, 'Referral canceled successfully.');
  }
}
