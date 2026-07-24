import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { Session } from '@/domain/entities/session';

interface ExpireSessionUseCaseInput {
  tokenHash?: string;
  userId?: string;
  logout?: boolean;
}

@Injectable()
@Log()
export class ExpireSessionUseCase {
  constructor(
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
    private readonly logger: LogService,
  ) {}

  async execute({
    tokenHash,
    userId,
    logout,
  }: ExpireSessionUseCaseInput): Promise<void> {
    if (!tokenHash && !userId) {
      this.logger.log(
        'Expire session skipped: no <tokenHash> and <userId> provided',
      );
      return;
    }

    const WHERE_MAPPING = {
      tokenHash: { tokenHash },
      userId: { user: { id: userId } },
    };

    const where = WHERE_MAPPING[tokenHash ? 'tokenHash' : 'userId'];

    await this.sessionsRepository.update(where, {
      expiresAt: new Date(Date.now() - 1000),
    });

    this.logger.log(
      `Session expired by <${tokenHash ? 'tokenHash' : 'userId'}>`,
      { logout },
    );
  }
}
