import { JwtService, JwtSignOptions } from '@nestjs/jwt';

import { getTokenMaxAge, TOKEN_EXPIRY_TIME } from '@/config/tokens';
import { Token } from '@/domain/entities/token';
import { TOKENS, TokenType } from '@/domain/enums/tokens';
import type { UserRole } from '@/domain/enums/users';
import type { AuthTokenPayloads } from '@/domain/schemas/tokens';

import { getTestApp, getTestDataSource } from '../config/setup-e2e';

async function createToken<T extends TokenType>(
  type: T,
  payload: AuthTokenPayloads[T],
  options?: JwtSignOptions,
): Promise<{ token: string; maxAge: number; expiresAt: Date }> {
  const expiryTime = TOKEN_EXPIRY_TIME[type];
  const maxAge = getTokenMaxAge(type);

  const expiresIn = `${expiryTime.value}${expiryTime.time}`;
  const expiresAt = new Date(Date.now() + maxAge);

  const app = getTestApp();
  const jwtService = app.get(JwtService);

  const token = await jwtService.signAsync(payload, {
    expiresIn,
    ...options,
  });

  return { token, maxAge, expiresAt };
}

export async function createInviteToken({
  email,
  role,
}: {
  email: string;
  role: UserRole;
}): Promise<Token> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Token);

  const { token, expiresAt } = await createToken(TOKENS.inviteUser, { role });

  const entity = repo.create({
    type: TOKENS.inviteUser,
    email,
    token,
    expiresAt,
  });

  await repo.save(entity);

  return entity;
}

export async function createPasswordResetToken({
  userId: sub,
}: {
  userId: string;
}): Promise<Token> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Token);

  const { token, expiresAt } = await createToken(TOKENS.passwordReset, { sub });

  const entity = repo.create({
    type: TOKENS.passwordReset,
    userId: sub,
    token,
    expiresAt,
  });

  await repo.save(entity);

  return entity;
}

export async function getTokenById(id: string): Promise<Token | null> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Token);
  return await repo.findOne({ where: { id } });
}
