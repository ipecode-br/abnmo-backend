import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Token } from '@/domain/entities/token';

@Injectable()
export class TokensRepository {
  constructor(
    @InjectRepository(Token)
    private readonly repo: Repository<Token>,
  ) {}

  async saveRefreshToken(data: {
    user_id: string;
    email: string;
    token: string;
    expires_at: Date;
  }) {
    const token = this.repo.create({
      user_id: data.user_id,
      email: data.email,
      token: data.token,
      type: 'access_token',
      expires_at: data.expires_at,
    });

    await this.repo.save(token);
  }

  async findValidToken(token: string) {
    return this.repo.findOne({
      where: {
        token,
      },
    });
  }

  async deleteToken(token: string) {
    await this.repo.delete({ token });
  }
}
