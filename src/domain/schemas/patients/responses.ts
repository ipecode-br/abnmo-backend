import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { patientSchema } from '.';

export const listPatientResponseSchema = patientSchema.pick({
  id: true,
  name: true,
  email: true,
  cpf: true,
  status: true,
  avatarUrl: true,
  createdAt: true,
});
export type ListPatientResponse = z.infer<typeof listPatientResponseSchema>;

export const getPatientsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    patients: z.array(listPatientResponseSchema),
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

export const patientResponseSchema = patientSchema.pick({
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  status: true,
  cpf: true,
  susId: true,
  supportContacts: true,
  updatedAt: true,
  createdAt: true,
});
export type PatientResponse = z.infer<typeof patientResponseSchema>;

export const getPatientResponseSchema = baseResponseSchema.extend({
  data: patientSchema,
});
