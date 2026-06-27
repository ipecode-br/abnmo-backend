import { faker } from '@faker-js/faker';

export function generateFakeName(): string {
  const name = faker.person.fullName().split('. ');
  return name.length > 1 ? name[1] : name[0];
}

export function generateFakeEmail(): string {
  return faker.internet.email().toLowerCase();
}

export function generateFakePhone(): string {
  return faker.string.numeric(11);
}
