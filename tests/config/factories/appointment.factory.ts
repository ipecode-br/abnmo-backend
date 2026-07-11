import { faker } from '@faker-js/faker';

import { Appointment } from '@/domain/entities/appointment';
import { User } from '@/domain/entities/user';
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
  patient: User,
  overrides: Partial<Appointment> = {},
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
    patient,
    specialist: null,
    ...overrides,
  };
}
