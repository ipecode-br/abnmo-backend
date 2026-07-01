import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { Session } from '@/domain/entities/session';

interface ExpireSessionUseCaseInput {
  tokenHash?: string;
  userId?: string;
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
  }: ExpireSessionUseCaseInput): Promise<void> {
    const where = tokenHash ? { tokenHash } : { userId: userId! };

    await this.sessionsRepository.update(where, {
      expiresAt: new Date(Date.now() - 1000),
    });

    this.logger.log(`Session expired by ${tokenHash ? 'tokenHash' : 'userId'}`);
  }
}
