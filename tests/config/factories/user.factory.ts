import { faker } from '@faker-js/faker';

import { User } from '@/domain/entities/user';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/shared';
import { USER_FEATURES, USER_ROLES, USER_STATUSES } from '@/domain/enums/users';

import { baseEntityFactory, emailFactory, nameFactory } from './shared.factory';

export function userFactory(overrides: Partial<User> = {}): User {
  const features = [
    ...new Set([...faker.helpers.arrayElements(USER_FEATURES)]),
  ];

  return {
    ...baseEntityFactory(),
    name: nameFactory(),
    email: emailFactory(),
    password: faker.internet.password(),
    phone: null,
    role: faker.helpers.arrayElement(USER_ROLES),
    features,
    status: faker.helpers.arrayElement(USER_STATUSES),
    specialty: null,
    registrationId: null,
    cpf: null,
    susId: null,
    supportContacts: null,
    avatarUrl: null,
    documents: [],
    surveySubmission: null,
    surveySubmissionsUpdated: [],
    survey: null,
    appointmentsAsSpecialist: [],
    referralsAsSpecialist: [],
    ...overrides,
  };
}

export function adminUserFactory(overrides: Partial<User> = {}) {
  return userFactory({
    role: 'admin',
    features: [...USER_FEATURES],
    ...overrides,
  });
}

export function specialistUserFactory(overrides: Partial<User> = {}) {
  return userFactory({
    role: 'specialist',
    features: ['read:appointment', 'update:appointment', 'create:appointment'],
    specialty: faker.helpers.arrayElement(SPECIALTY_CATEGORIES),
    ...overrides,
  });
}

export function memberUserFactory(overrides: Partial<User> = {}) {
  return userFactory({
    role: 'member',
    features: [
      'read:patient:others',
      'read:appointment:others',
      'read:survey:others',
    ],
    ...overrides,
  });
}

export function patientUserFactory(overrides: Partial<User> = {}) {
  return userFactory({ role: 'patient', ...overrides });
}
