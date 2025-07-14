import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Token } from '@/domain/entities/token';

import type { CreateAuthTokenDto } from './auth.dtos';

@Injectable()
export class TokensRepository {
  constructor(
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
  ) {}

  async saveToken(data: CreateAuthTokenDto) {
    const token = this.tokensRepository.create(data);
    await this.tokensRepository.save(token);
  }

  async findToken(token: string) {
    return this.tokensRepository.findOne({ where: { token } });
  }

  async deleteToken(token: string) {
    await this.tokensRepository.delete({ token });
  }
}
