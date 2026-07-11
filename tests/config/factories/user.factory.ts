import { faker } from '@faker-js/faker';

import { User } from '@/domain/entities/user';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/shared';
import { KINSHIP_TYPES } from '@/domain/enums/surveys';
import {
  DEFAULT_MEMBER_FEATURES,
  DEFAULT_PATIENT_FEATURES,
  DEFAULT_SPECIALIST_FEATURES,
  USER_ROLES,
  USER_STATUSES,
} from '@/domain/enums/users';

import {
  baseEntityFactory,
  emailFactory,
  nameFactory,
  phoneFactory,
} from './shared.factory';

export function userFactory(overrides: Partial<User> = {}): User {
  const role = overrides.role ?? faker.helpers.arrayElement(USER_ROLES);

  const randomNumber = faker.number.int({ min: 1, max: 99 });
  const randomGender = faker.helpers.arrayElement(['male', 'female']);
  const avatarUrl = `https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/${randomGender}/256/${randomNumber}.jpg`;

  const data: User = {
    ...baseEntityFactory(),
    name: nameFactory(),
    email: emailFactory(),
    password: faker.internet.password(),
    phone: null,
    role,
    features: [],
    status: faker.helpers.arrayElement(USER_STATUSES),
    specialty: null,
    registrationId: null,
    cpf: null,
    susId: null,
    supportContacts: null,
    avatarUrl,
    documents: [],
    surveySubmission: null,
    surveySubmissionsUpdated: [],
    survey: null,
    appointmentsAsSpecialist: [],
    referralsAsSpecialist: [],
  };

  if (role === 'member') {
    data.features = [...DEFAULT_MEMBER_FEATURES];
  }

  if (role === 'specialist') {
    data.features = [...DEFAULT_SPECIALIST_FEATURES];
    data.specialty = faker.helpers.arrayElement(SPECIALTY_CATEGORIES);
    data.registrationId = faker.vehicle.vrm();
  }

  if (role === 'patient') {
    data.features = [...DEFAULT_PATIENT_FEATURES];
    data.phone = phoneFactory();
    data.susId = faker.string.numeric(15);
    data.cpf = faker.string.numeric(11);

    const supportCount = faker.number.int({ min: 0, max: 2 });
    data.supportContacts = Array.from({ length: supportCount }, () => ({
      name: nameFactory(),
      kinship: faker.helpers.arrayElement(KINSHIP_TYPES),
      phone: phoneFactory(),
    }));
  }

  return { ...data, ...overrides } as User;
}

export function adminUserFactory(overrides: Partial<User> = {}) {
  return userFactory({ role: 'admin', ...overrides });
}

export function specialistUserFactory(overrides: Partial<User> = {}) {
  return userFactory({ role: 'specialist', ...overrides });
}

export function memberUserFactory(overrides: Partial<User> = {}) {
  return userFactory({ role: 'member', ...overrides });
}

export function patientUserFactory(overrides: Partial<User> = {}) {
  return userFactory({ role: 'patient', ...overrides });
}
