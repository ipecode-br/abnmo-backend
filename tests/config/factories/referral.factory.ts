import { faker } from '@faker-js/faker';

import { Referral } from '@/domain/entities/referral';
import { User } from '@/domain/entities/user';
import { PATIENT_CONDITIONS } from '@/domain/enums/patients';
import { REFERRAL_STATUSES } from '@/domain/enums/referrals';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/shared';

import {
  baseEntityFactory,
  dateFactory,
  idFactory,
  nameFactory,
} from './shared.factory';

export function referralFactory(
  patient: User,
  overrides: Partial<Referral> = {},
): Referral {
  return {
    ...baseEntityFactory(),
    date: dateFactory(4, 4),
    status: faker.helpers.arrayElement(REFERRAL_STATUSES),
    category: faker.helpers.arrayElement(SPECIALTY_CATEGORIES),
    condition: faker.helpers.arrayElement(PATIENT_CONDITIONS),
    annotation: faker.datatype.boolean() ? faker.lorem.sentences() : null,
    professionalName: faker.datatype.boolean() ? nameFactory() : null,
    createdBy: idFactory(),
    patient,
    specialist: null,
    ...overrides,
  };
}
