import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Token } from '@/domain/entities/token';

interface LogoutUseCaseRequest {
  token: string;
}

type LogoutUseCaseResponse = Promise<void>;

@Injectable()
export class LogoutUseCase {
  private readonly logger = new Logger(LogoutUseCase.name);

  constructor(
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
  ) {}

  async execute({ token }: LogoutUseCaseRequest): LogoutUseCaseResponse {
    await this.tokensRepository.delete({ token });

    this.logger.log({}, 'User logged out');
  }
}
