import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type { AuthUser } from '@/common/types';
import { Referral } from '@/domain/entities/referral';
import type { PatientCondition } from '@/domain/enums/patients';

interface UpdateReferralUseCaseInput {
  id: string;
  user: AuthUser;
  date: Date;
  condition: PatientCondition;
  annotation: string | null;
}

@Injectable()
export class UpdateReferralUseCase {
  private readonly logger = new Logger(UpdateReferralUseCase.name);

  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
  ) {}

  async execute({
    id,
    user,
    date,
    condition,
    annotation,
  }: UpdateReferralUseCaseInput): Promise<void> {
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

    this.logger.log(
      { id, userId: user.id, userEmail: user.email, userRole: user.role },
      'Referral updated successfully',
    );
  }
}
