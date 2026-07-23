import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { can } from '@/common/authorization/can';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { Token } from '@/domain/entities/token';
import { TOKENS } from '@/domain/enums/tokens';

interface CancelUserInviteUseCaseInput {
  id: string;
  user: RequestUser;
}

@Injectable()
@Log()
export class CancelUserInviteUseCase {
  constructor(
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly logger: LogService,
  ) {}

  async execute({ id, user }: CancelUserInviteUseCaseInput): Promise<void> {
    can(user, 'delete:user-invite');

    const token = await this.tokensRepository.findOne({
      where: { id, type: TOKENS.inviteUser },
      select: { id: true },
    });

    if (!token) {
      throw new NotFoundException('Convite não encontrado.');
    }

    await this.tokensRepository.remove(token);

    this.logger.log('Invite user token canceled', {
      id: token.id,
      email: token.email,
    });
  }
}
