import { faker } from '@faker-js/faker';
import type { DeepPartial, Repository } from 'typeorm';

import { Referral } from '@/domain/entities/referral';
import { PATIENT_CONDITIONS } from '@/domain/enums/patients';
import { REFERRAL_STATUSES } from '@/domain/enums/referrals';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/shared';

import { generateFakeDate, generateFakeName } from './generate-fakes';

export function generateFakeReferral(
  repository: Repository<Referral>,
  data: DeepPartial<Referral>,
): Referral {
  const baseData: DeepPartial<Referral> = {
    date: generateFakeDate(),
    status: faker.helpers.arrayElement(REFERRAL_STATUSES),
    category: faker.helpers.arrayElement(SPECIALTY_CATEGORIES),
    condition: faker.helpers.arrayElement(PATIENT_CONDITIONS),
    annotation: faker.datatype.boolean() ? faker.lorem.sentences() : null,
    professionalName: faker.datatype.boolean() ? generateFakeName() : null,
  };

  return repository.create({ ...baseData, ...data });
}
