import { faker } from '@faker-js/faker';

import { Referral } from '@/domain/entities/referral';
import { PATIENT_CONDITIONS } from '@/domain/enums/patients';
import { REFERRAL_STATUSES } from '@/domain/enums/referrals';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/shared';

import {
  baseEntityFactory,
  datetimeFactory,
  idFactory,
  nameFactory,
} from './shared.factory';

export function referralFactory(
  overrides: Partial<Referral> & { patient: Referral['patient'] },
): Referral {
  return {
    ...baseEntityFactory(),
    date: datetimeFactory(4, 4),
    status: faker.helpers.arrayElement(REFERRAL_STATUSES),
    category: faker.helpers.arrayElement(SPECIALTY_CATEGORIES),
    condition: faker.helpers.arrayElement(PATIENT_CONDITIONS),
    annotation: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    professionalName: faker.datatype.boolean() ? nameFactory() : null,
    createdBy: idFactory(),
    specialist: null,
    ...overrides,
  };
}
