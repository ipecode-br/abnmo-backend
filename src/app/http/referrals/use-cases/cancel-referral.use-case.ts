import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { Referral } from '@/domain/entities/referral';

interface CancelReferralUseCaseInput {
  id: string;
}

@Log()
@Injectable()
export class CancelReferralUseCase {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
    private readonly logger: LogService,
  ) {}

  async execute({ id }: CancelReferralUseCaseInput): Promise<void> {
    this.logger.setEvent('cancel_referral');

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

    await this.referralsRepository.update({ id }, { status: 'canceled' });

    this.logger.log('Referral canceled successfully', { id });
  }
}
