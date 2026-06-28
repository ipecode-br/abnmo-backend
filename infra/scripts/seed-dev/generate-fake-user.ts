import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';

import { User } from '@/domain/entities/user';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/shared';
import { KINSHIP_TYPES } from '@/domain/enums/survey';
import { USER_FEATURES, USER_ROLES, USER_STATUSES } from '@/domain/enums/users';

import {
  generateFakeDate,
  generateFakeEmail,
  generateFakeName,
  generateFakePhone,
} from './generate-fakes';

export function generateFakeUser(
  repository: Repository<User>,
  data: { password: string } & Partial<User>,
): User {
  const baseData: Partial<User> = {
    name: generateFakeName(),
    email: generateFakeEmail(),
    password: data.password,
    role: faker.helpers.arrayElement(USER_ROLES),
    features: faker.helpers.arrayElements(USER_FEATURES),
    status: faker.helpers.arrayElement(USER_STATUSES),
    avatarUrl: faker.image.avatar(),
    createdAt: generateFakeDate(),
  };

  const mergedData = { ...baseData, ...data };

  if (mergedData.role === 'patient') {
    mergedData.susId = faker.string.numeric(15);
    mergedData.cpf = faker.string.numeric(11);

    const supportCount = faker.number.int({ min: 0, max: 2 });
    mergedData.supportContacts = Array.from({ length: supportCount }, () => ({
      name: generateFakeName(),
      kinship: faker.helpers.arrayElement(KINSHIP_TYPES),
      phone: generateFakePhone(),
    }));
  }

  if (mergedData.role === 'specialist') {
    mergedData.specialty = faker.helpers.arrayElement(SPECIALTY_CATEGORIES);
    mergedData.registrationId = faker.vehicle.vrm();
  }

  return repository.create(mergedData);
}
