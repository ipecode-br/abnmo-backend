import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Referral } from '@/domain/entities/referral';

import type { AuthUserDto } from '../../auth/auth.dtos';
import type { UpdateReferralDto } from '../referrals.dtos';

interface UpdateReferralUseCaseInput {
  id: string;
  user: AuthUserDto;
  updateReferralDto: UpdateReferralDto;
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
    updateReferralDto,
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

    Object.assign(referral, updateReferralDto);

    await this.referralsRepository.save(referral);

    this.logger.log(
      { id, userId: user.id, userEmail: user.email, userRole: user.role },
      'Referral updated successfully',
    );
  }
}
