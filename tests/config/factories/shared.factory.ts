import { faker } from '@faker-js/faker';
import { v7 as uuidv7 } from 'uuid';

export function baseEntityFactory() {
  return {
    id: idFactory(),
    updatedAt: new Date(),
    createdAt: new Date(),
    generateId: () => {},
  };
}

export function idFactory(): string {
  return uuidv7();
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

export function dateFactory(monthsBefore = 4, monthsAhead = 0): Date {
  return faker.date.between({
    from: new Date().setMonth(new Date().getMonth() - monthsBefore),
    to: new Date().setMonth(new Date().getMonth() + monthsAhead),
  });
}
