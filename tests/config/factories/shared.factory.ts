import { faker } from '@faker-js/faker';

import type { RequestUser } from '@/common/types';

export function baseEntityFactory() {
  return {
    id: idFactory(),
    updatedAt: new Date(),
    createdAt: new Date(),
    generateId: () => {},
  };
}

export function idFactory(): string {
  return faker.string.uuid({ version: 7 });
}

export function nameFactory(): string {
  const name = faker.person.fullName().split('. ');
  return name.length > 1 ? name[1] : name[0];
}

export function emailFactory(): string {
  return faker.internet.email().toLowerCase();
}

export function phoneFactory(): string {
  return faker.string.numeric(11);
}

export function dateFactory({
  from,
  to,
}: {
  from: string | Date | number;
  to: string | Date | number;
}): string {
  const date = faker.date.between({ from, to });
  return date.toISOString().split('T')[0];
}

export function datetimeFactory(monthsBefore = 4, monthsAhead = 0): Date {
  return faker.date.between({
    from: new Date().setMonth(new Date().getMonth() - monthsBefore),
    to: new Date().setMonth(new Date().getMonth() + monthsAhead),
  });
}

export function requestUserFactory(
  overrides: Partial<RequestUser> = {},
): RequestUser {
  return {
    id: idFactory(),
    email: emailFactory(),
    role: 'member',
    features: [],
    ...overrides,
  };
}
