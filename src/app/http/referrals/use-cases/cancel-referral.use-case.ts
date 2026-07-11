import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { can } from '@/common/authorization/can';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { Referral } from '@/domain/entities/referral';

interface CancelReferralUseCaseInput {
  user: RequestUser;
  id: string;
}

@Injectable()
@Log()
export class CancelReferralUseCase {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
    private readonly logger: LogService,
  ) {}

  async execute({ id, user }: CancelReferralUseCaseInput): Promise<void> {
    const referral = await this.referralsRepository.findOne({
      select: { id: true, status: true, specialist: { id: true } },
      relations: { specialist: true },
      where: { id },
    });

    if (!referral) {
      throw new NotFoundException('Encaminhamento não encontrado.', {
        cause: `Referral with ID <${id}> not found`,
      });
    }

    can(
      user,
      ['cancel:referral', 'cancel:referral:others'],
      referral.specialist?.id,
    );

    if (referral.status === 'canceled') {
      throw new BadRequestException('Este encaminhamento já está cancelado.', {
        cause: `Referral with ID <${id}> is already canceled`,
      });
    }

    await this.referralsRepository.update(id, { status: 'canceled' });

    this.logger.log('Referral canceled', { id });
  }
}
