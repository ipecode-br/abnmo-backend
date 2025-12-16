import { z } from 'zod';

import { patientSupportSchema } from '.';

export const createPatientSupportSchema = patientSupportSchema.pick({
  patient_id: true,
  name: true,
  phone: true,
  kinship: true,
});
export type CreatePatientSupport = z.infer<typeof createPatientSupportSchema>;

export const updatePatientSupportParamsSchema = z.object({
  id: z.string().uuid(),
});
export type UpdatePatientSupportParams = z.infer<
  typeof updatePatientSupportParamsSchema
>;

export const updatePatientSupportSchema = patientSupportSchema.pick({
  name: true,
  phone: true,
  kinship: true,
});
export type UpdatePatientSupport = z.infer<typeof updatePatientSupportSchema>;

export const deletePatientSupportParamsSchema = z.object({
  id: z.string().uuid(),
});
export type DeletePatientSupportParams = z.infer<
  typeof deletePatientSupportParamsSchema
>;
