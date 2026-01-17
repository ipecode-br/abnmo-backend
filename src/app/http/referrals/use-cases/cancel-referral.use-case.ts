import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Referral } from '@/domain/entities/referral';

interface CancelReferralUseCaseInput {
  id: string;
  userId: string;
}

@Injectable()
export class CancelReferralUseCase {
  private readonly logger = new Logger(CancelReferralUseCase.name);

  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
  ) {}

  async execute({ id, userId }: CancelReferralUseCaseInput): Promise<void> {
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
