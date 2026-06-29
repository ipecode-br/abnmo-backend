import { faker } from '@faker-js/faker';
import type { DeepPartial, Repository } from 'typeorm';

import { Appointment } from '@/domain/entities/appointment';
import { APPOINTMENT_STATUSES } from '@/domain/enums/appointments';
import { PATIENT_CONDITIONS } from '@/domain/enums/patients';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/shared';

import { generateFakeDate, generateFakeName } from './generate-fakes';

export function generateFakeAppointment(
  repository: Repository<Appointment>,
  data: DeepPartial<Appointment>,
): Appointment {
  const baseData: DeepPartial<Appointment> = {
    date: generateFakeDate(),
    status: faker.helpers.arrayElement(APPOINTMENT_STATUSES),
    category: faker.helpers.arrayElement(SPECIALTY_CATEGORIES),
    condition: faker.helpers.arrayElement(PATIENT_CONDITIONS),
    annotation: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    professionalName: faker.datatype.boolean() ? generateFakeName() : null,
  };

  return repository.create({ ...baseData, ...data });
}
