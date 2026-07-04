import { faker } from '@faker-js/faker';
import dataSource from 'infra/database/data.source';
import type { DeepPartial } from 'typeorm';

import { Appointment } from '@/domain/entities/appointment';
import { APPOINTMENT_STATUSES } from '@/domain/enums/appointments';
import { PATIENT_CONDITIONS } from '@/domain/enums/patients';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/shared';

import { generateFakeDate, generateFakeName } from './generate-fakes';

export function generateFakeAppointment(
  data: DeepPartial<Appointment>,
): Appointment {
  const repository = dataSource.getRepository(Appointment);

  const baseData: DeepPartial<Appointment> = {
    date: generateFakeDate(4, 2),
    status: faker.helpers.arrayElement(APPOINTMENT_STATUSES),
    category: faker.helpers.arrayElement(SPECIALTY_CATEGORIES),
    condition: faker.helpers.arrayElement(PATIENT_CONDITIONS),
    annotation: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    professionalName: faker.datatype.boolean() ? generateFakeName() : null,
  };

  return repository.create({ ...baseData, ...data });
}
