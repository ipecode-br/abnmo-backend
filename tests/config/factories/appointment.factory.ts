import { faker } from '@faker-js/faker';

import { Appointment } from '@/domain/entities/appointment';
import { APPOINTMENT_STATUSES } from '@/domain/enums/appointments';
import { PATIENT_CONDITIONS } from '@/domain/enums/patients';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/shared';

import {
  baseEntityFactory,
  dateFactory,
  idFactory,
  nameFactory,
} from './shared.factory';

export function appointmentFactory(
  overrides: Partial<Appointment> & { patient: Appointment['patient'] },
): Appointment {
  return {
    ...baseEntityFactory(),
    date: dateFactory(4, 4),
    status: faker.helpers.arrayElement(APPOINTMENT_STATUSES),
    category: faker.helpers.arrayElement(SPECIALTY_CATEGORIES),
    condition: faker.helpers.arrayElement(PATIENT_CONDITIONS),
    annotation: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    professionalName: faker.datatype.boolean() ? nameFactory() : null,
    createdBy: idFactory(),
    specialist: null,
    ...overrides,
  };
}
