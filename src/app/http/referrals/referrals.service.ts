import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { UserSchema } from '@/domain/schemas/user';

import { ReferralsRepository } from './referrals.repository';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);
  constructor(private readonly referralsRepository: ReferralsRepository) {}

  async cancel(id: string, user: UserSchema): Promise<void> {
    const referral = await this.referralsRepository.findById(id);

    if (!referral) {
      throw new NotFoundException('Encaminhamento não encontrado.');
    }

    if (referral.status === 'canceled') {
      throw new BadRequestException('Este encaminhamento já está cancelado.');
    }

    await this.referralsRepository.cancel(referral.id);

    this.logger.log(
      { id: referral.id, userId: user.id },
      'Referral canceled successfully.',
    );
  }
}
