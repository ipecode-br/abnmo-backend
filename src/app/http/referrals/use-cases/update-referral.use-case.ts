import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
import { Referral } from '@/domain/entities/referral';
import type { PatientCondition } from '@/domain/enums/patients';

interface UpdateReferralUseCaseInput {
  id: string;
  date: Date;
  condition: PatientCondition;
  annotation: string | null;
}

@Logger()
@Injectable()
export class UpdateReferralUseCase {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
    private readonly logger: AppLogger,
  ) {}

  async execute({
    id,
    date,
    condition,
    annotation,
  }: UpdateReferralUseCaseInput): Promise<void> {
    this.logger.setEvent('update_referral');

    const referral = await this.referralsRepository.findOne({ where: { id } });

    if (!referral) {
      throw new NotFoundException('Encaminhamento não encontrado.');
    }

    if (referral.status === 'canceled') {
      throw new BadRequestException(
        'Não é possível atualizar um encaminhamento cancelado.',
      );
    }

    await this.referralsRepository.update(referral.id, {
      date,
      condition,
      annotation,
    });

    this.logger.log('Referral updated successfully', { id });
  }
}
