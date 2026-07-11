import { faker } from '@faker-js/faker';

import { PatientRequirement } from '@/domain/entities/patient-requirement';
import { User } from '@/domain/entities/user';
import {
  PATIENT_REQUIREMENT_STATUSES,
  PATIENT_REQUIREMENT_TYPES,
} from '@/domain/enums/patient-requirements';

import { idFactory } from './shared.factory';

export function patientRequirementFactory(
  patient: User,
  overrides: Partial<PatientRequirement> = {},
): PatientRequirement {
  const data: PatientRequirement = {
    id: idFactory(),
    patientId: patient.id,
    type: faker.helpers.arrayElement(PATIENT_REQUIREMENT_TYPES),
    title: 'Solicitação de documento',
    description: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    status: faker.helpers.arrayElement(PATIENT_REQUIREMENT_STATUSES),
    submittedAt: null,
    approvedBy: null,
    approvedAt: null,
    declinedBy: null,
    declinedAt: null,
    createdBy: idFactory(),
    patient,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  if (data.status !== 'pending') {
    data.submittedAt = faker.date.recent();
  }
  if (data.status === 'approved') {
    data.approvedBy = idFactory();
    data.approvedAt = faker.date.recent();
  }
  if (data.status === 'declined') {
    data.declinedBy = idFactory();
    data.declinedAt = faker.date.recent();
  }

  return data;
}
