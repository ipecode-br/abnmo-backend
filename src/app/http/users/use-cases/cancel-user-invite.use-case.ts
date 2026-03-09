import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { AuthUser } from '@/common/types';
import { Token } from '@/domain/entities/token';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';

interface CancelUserInviteUseCaseInput {
  id: number;
  user: AuthUser;
}

@Injectable()
export class CancelUserInviteUseCase {
  private readonly logger = new Logger(CancelUserInviteUseCase.name);

  constructor(
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
  ) {}

  async execute({ id, user }: CancelUserInviteUseCaseInput): Promise<void> {
    const token = await this.tokensRepository.findOne({
      where: { id, type: AUTH_TOKENS_MAPPING.invite_user },
      select: { id: true },
    });

    if (!token) {
      throw new NotFoundException('Convite não encontrado.');
    }

    await this.tokensRepository.remove(token);

    this.logger.log(
      {
        id: token.id,
        email: token.email,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
      },
      'Invite user token canceled successfully',
    );
  }
}
