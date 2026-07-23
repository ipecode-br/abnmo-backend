import { faker } from '@faker-js/faker';

import { Session } from '@/domain/entities/session';
import { User } from '@/domain/entities/user';

import { baseEntityFactory, datetimeFactory } from './shared.factory';

export function sessionFactory(
  overrides: Partial<Session> & { user: User },
): Session {
  return {
    ...baseEntityFactory(),
    tokenHash: faker.string.hexadecimal({ length: 64 }),
    expiresAt: datetimeFactory(0, 2),
    ...overrides,
  };
}
