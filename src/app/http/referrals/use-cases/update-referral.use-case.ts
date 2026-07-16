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
import type { PatientCondition } from '@/domain/enums/patients';

interface UpdateReferralUseCaseInput {
  user: RequestUser;
  id: string;
  date: Date;
  condition: PatientCondition;
  annotation: string | null;
}

@Injectable()
@Log()
export class UpdateReferralUseCase {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
    private readonly logger: LogService,
  ) {}

  async execute({
    id,
    user,
    date,
    condition,
    annotation,
  }: UpdateReferralUseCaseInput): Promise<void> {
    const referral = await this.referralsRepository.findOne({
      relations: { specialist: true, patient: true },
      where: { id },
      select: {
        id: true,
        status: true,
        specialist: { id: true },
        patient: { id: true },
      },
    });

    if (!referral) {
      throw new NotFoundException('Encaminhamento não encontrado.', {
        cause: `Referral with ID <${id}> not found`,
      });
    }

    can(
      user,
      ['update:referral', 'update:referral:others'],
      [referral.patient.id || referral.specialist?.id || ''],
    );

    if (referral.status === 'canceled') {
      throw new BadRequestException(
        'Não é possível atualizar um encaminhamento cancelado.',
        { cause: `Referral with ID <${id}> is already canceled` },
      );
    }

    await this.referralsRepository.update(referral.id, {
      date,
      condition,
      annotation,
    });

    this.logger.log('Referral updated', { id });
  }
}
