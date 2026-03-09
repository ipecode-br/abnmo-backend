import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
import { Token } from '@/domain/entities/token';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';

interface CancelUserInviteUseCaseInput {
  id: number;
}

@Logger()
@Injectable()
export class CancelUserInviteUseCase {
  constructor(
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly logger: AppLogger,
  ) {}

  async execute({ id }: CancelUserInviteUseCaseInput): Promise<void> {
    this.logger.setEvent('cancel_user_invite');

    const token = await this.tokensRepository.findOne({
      where: { id, type: AUTH_TOKENS_MAPPING.inviteUser },
      select: { id: true },
    });

    if (!token) {
      throw new NotFoundException('Convite não encontrado.');
    }

    await this.tokensRepository.remove(token);

    this.logger.log('Invite user token canceled successfully', {
      id: token.id,
      email: token.email,
    });
  }
}
