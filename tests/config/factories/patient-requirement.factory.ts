import { fakerPT_BR as faker } from '@faker-js/faker';

import { PatientRequirement } from '@/domain/entities/patient-requirement';
import { User } from '@/domain/entities/user';
import {
  PATIENT_REQUIREMENT_STATUSES,
  PATIENT_REQUIREMENT_TYPES,
} from '@/domain/enums/patient-requirements';

import { baseEntityFactory, idFactory } from './shared.factory';

export function patientRequirementFactory(
  overrides: Partial<PatientRequirement> & { patient: User },
): PatientRequirement {
  const data: PatientRequirement = {
    ...baseEntityFactory(),
    title: 'Solicitação de documento',
    description: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    type: faker.helpers.arrayElement(PATIENT_REQUIREMENT_TYPES),
    status: faker.helpers.arrayElement(PATIENT_REQUIREMENT_STATUSES),
    submittedAt: null,
    updatedBy: null,
    createdBy: idFactory(),
    ...overrides,
  };

  if (data.status !== 'pending') {
    data.submittedAt = faker.date.recent();
  }
  if (data.status === 'approved') {
    data.updatedBy = idFactory();
  }
  if (data.status === 'declined') {
    data.updatedBy = idFactory();
  }

  return data;
}
