import { Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';

import { getTokenMaxAge, TOKEN_EXPIRY_TIME } from '@/config/tokens';
import { TokenType } from '@/domain/enums/tokens';
import type { AuthTokenPayloads } from '@/domain/schemas/tokens';

interface CreateTokenUseCaseInput<T extends TokenType> {
  type: T;
  payload: AuthTokenPayloads[T];
  options?: JwtSignOptions;
}

interface CreateAccessTokenUseCaseOutput {
  token: string;
  maxAge: number;
  expiresAt: Date;
}

@Injectable()
export class CreateTokenUseCase {
  constructor(private readonly jwtService: JwtService) {}

  async execute<T extends keyof AuthTokenPayloads>({
    type,
    payload,
    options,
  }: CreateTokenUseCaseInput<T>): Promise<CreateAccessTokenUseCaseOutput> {
    const expiryTime = TOKEN_EXPIRY_TIME[type];
    const maxAge = getTokenMaxAge(type);

    const expiresIn = `${expiryTime.value}${expiryTime.time}`;
    const expiresAt = new Date(Date.now() + maxAge);

    const token = await this.jwtService.signAsync(payload, {
      expiresIn,
      ...options,
    });

    return { token, maxAge, expiresAt };
  }
}
