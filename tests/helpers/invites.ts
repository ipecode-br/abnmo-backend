import { faker } from '@faker-js/faker';
import { FindOptionsWhere } from 'typeorm';

import { Token } from '@/domain/entities/token';
import { TOKENS } from '@/domain/enums/tokens';

import { idFactory } from '../config/factories/shared.factory';
import { getTestDataSource } from '../config/setup-e2e';

export async function createUserInvite(
  overrides: Partial<Token> = {},
): Promise<Token> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Token);

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 8);

  const invite = repo.create({
    id: idFactory(),
    token: faker.string.alphanumeric(32),
    type: TOKENS.inviteUser,
    email: faker.internet.email().toLowerCase(),
    expiresAt,
    ...overrides,
  });

  await repo.save(invite);

  return invite;
}

export async function getUserInvites(
  options: { email?: string } = {},
): Promise<Token[]> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Token);
  const where: FindOptionsWhere<Token> = {
    type: TOKENS.inviteUser,
  };

  if (options.email) where.email = options.email;

  return await repo.find({ where, order: { createdAt: 'DESC' } });
}
