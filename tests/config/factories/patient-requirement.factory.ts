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
  const result: PatientRequirement = {
    id: idFactory(),
    patientId: patient.id,
    type: faker.helpers.arrayElement(PATIENT_REQUIREMENT_TYPES),
    title: 'Solicitação de Documento',
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

  if (result.status !== 'pending') {
    result.submittedAt = faker.date.recent();
  }
  if (result.status === 'approved') {
    result.approvedBy = idFactory();
    result.approvedAt = faker.date.recent();
  }
  if (result.status === 'declined') {
    result.declinedBy = idFactory();
    result.declinedAt = faker.date.recent();
  }

  return result;
}
