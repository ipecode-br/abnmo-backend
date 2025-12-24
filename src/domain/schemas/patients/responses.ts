import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { patientSupportSchema } from '../patient-support';
import { patientSchema } from '.';

export const patientResponseSchema = patientSchema.pick({
  id: true,
  name: true,
  email: true,
  status: true,
  avatar_url: true,
  phone: true,
  created_at: true,
});
export type PatientResponse = z.infer<typeof patientResponseSchema>;

export const getPatientsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    patients: z.array(patientResponseSchema),
    total: z.number(),
  }),
});
export type GetPatientsResponse = z.infer<typeof getPatientsResponseSchema>;

export const getPatientResponseSchema = baseResponseSchema.extend({
  data: patientSchema
    .omit({ password: true })
    .extend({ supports: z.array(patientSupportSchema) }),
});
export type GetPatientResponse = z.infer<typeof getPatientResponseSchema>;

export const getAllPatientsListResponseSchema = baseResponseSchema.extend({
  data: z.object({
    patients: z.array(patientSchema.pick({ id: true, name: true, cpf: true })),
  }),
});
export type GetAllPatientsListResponse = z.infer<
  typeof getAllPatientsListResponseSchema
>;
