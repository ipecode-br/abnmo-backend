import { Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';

import type { AuthTokenType } from '@/domain/enums/tokens';
import type { AuthTokenPayloads } from '@/domain/schemas/tokens';

interface CreateTokenUseCaseInput<T extends keyof AuthTokenPayloads> {
  type: T;
  payload: AuthTokenPayloads[T];
  options?: JwtSignOptions;
}

interface CreateAccessTokenUseCaseOutput {
  token: string;
  maxAge: number;
  expiresAt: Date;
}

type TokenExpiryTime = Record<
  AuthTokenType,
  { value: number; time: 'h' | 'd' }
>;

type TokenMaxAge = Record<AuthTokenType, number>;

@Injectable()
export class CreateTokenUseCase {
  constructor(private readonly jwtService: JwtService) {}

  async execute<T extends keyof AuthTokenPayloads>({
    type,
    payload,
    options,
  }: CreateTokenUseCaseInput<T>): Promise<CreateAccessTokenUseCaseOutput> {
    const EXPIRY_TIME: TokenExpiryTime = {
      access_token: { value: 8, time: 'h' },
      refresh_token: { value: 30, time: 'd' },
      password_reset: { value: 4, time: 'h' },
      invite_user: { value: 8, time: 'h' },
    };

    const expiryTime = EXPIRY_TIME[type];

    const MAX_AGES: TokenMaxAge = {
      access_token: 1000 * 60 * 60 * expiryTime.value,
      refresh_token: 1000 * 60 * 60 * 24 * expiryTime.value,
      password_reset: 1000 * 60 * 60 * expiryTime.value,
      invite_user: 1000 * 60 * 60 * expiryTime.value,
    };

    const maxAge = MAX_AGES[type];
    const expiresIn = `${expiryTime.value}${expiryTime.time}`;
    const expiresAt = new Date(Date.now() + maxAge);

    const token = await this.jwtService.signAsync(payload, {
      expiresIn,
      ...options,
    });

    return { token, maxAge, expiresAt };
  }
}
