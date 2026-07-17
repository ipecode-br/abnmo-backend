import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { surveySchema } from '../surveys';
import { patientSchema } from '.';

export const patientResponseSchema = patientSchema.pick({
  id: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  avatarUrl: true,
  createdAt: true,
});
export type PatientResponse = z.infer<typeof patientResponseSchema>;

export const getPatientsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    patients: z.array(patientResponseSchema),
    total: z.number(),
  }),
});

export const patientOptionResponseSchema = patientSchema.pick({
  id: true,
  name: true,
  cpf: true,
});
export type PatientOptionResponse = z.infer<typeof patientOptionResponseSchema>;

export const getPatientOptionsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    patients: z.array(patientOptionResponseSchema),
    total: z.number(),
  }),
});

export const patientDetailsResponseSchema = patientSchema.extend(
  surveySchema.pick({
    dateOfBirth: true,
    gender: true,
    race: true,
    maritalStatus: true,
    addressCep: true,
    addressState: true,
    addressCity: true,
    addressStreet: true,
    addressNumber: true,
    diagnosis: true,
    nmoMedications: true,
    generalMedications: true,
    hasVisualAlteration: true,
    usesVisualCane: true,
    usesWheelchair: true,
    hasMotorSequelae: true,
  }).shape,
);
export type PatientDetailsResponse = z.infer<
  typeof patientDetailsResponseSchema
>;

export const getPatientResponseSchema = baseResponseSchema.extend({
  data: patientDetailsResponseSchema,
});
