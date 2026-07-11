import { faker } from '@faker-js/faker';

import { Session } from '@/domain/entities/session';
import { User } from '@/domain/entities/user';

import { baseEntityFactory, dateFactory } from './shared.factory';

export function sessionFactory(
  user: User,
  overrides: Partial<Session> = {},
): Session {
  return {
    ...baseEntityFactory(),
    tokenHash: faker.string.hexadecimal({ length: 64 }),
    userId: user.id,
    expiresAt: dateFactory(0, 2),
    user,
    ...overrides,
  };
}
