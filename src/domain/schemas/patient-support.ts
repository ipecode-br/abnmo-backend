import { z } from 'zod';

import { baseResponseSchema } from './base';

// Entity

export const patientSupportSchema = z
  .object({
    id: z.string().uuid(),
    patient_id: z.string().uuid(),
    name: z.string().min(3).max(100),
    phone: z
      .string()
      .regex(/^\d+$/)
      .refine((num) => num.length === 11),
    kinship: z.string(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type PatientSupportSchema = z.infer<typeof patientSupportSchema>;

//Create

export const createPatientSupportSchema = patientSupportSchema.pick({
  patient_id: true,
  name: true,
  phone: true,
  kinship: true,
});
export type CreatePatientSupportSchema = z.infer<
  typeof createPatientSupportSchema
>;

export const createPatientSupportResponseSchema = baseResponseSchema.extend({});
export type CreatePatientSupportResponseSchema = z.infer<
  typeof createPatientSupportResponseSchema
>;

export const findAllPatientsSupportResponseSchema = baseResponseSchema.extend({
  data: z.object({
    patient_supports: z.array(patientSupportSchema),
    total: z.number(),
  }),
});
export type FindAllPatientsSupportResponseSchema = z.infer<
  typeof findAllPatientsSupportResponseSchema
>;

export const findOnePatientsSupportResponseSchema = baseResponseSchema.extend({
  data: patientSupportSchema,
});
export type FindOnePatientsSupportResponseSchema = z.infer<
  typeof findOnePatientsSupportResponseSchema
>;

//Update

export const updatePatientSupportParamsSchema = z.object({
  id: z.string().uuid(),
});
export type UpdatePatientSupportParamsSchema = z.infer<
  typeof updatePatientSupportParamsSchema
>;

export const updatePatientSupportSchema = patientSupportSchema.omit({
  id: true,
  patient_id: true,
  created_at: true,
  updated_at: true,
});
export type UpdatePatientSupportSchema = z.infer<
  typeof updatePatientSupportSchema
>;

export const updatePatientSupportResponseSchema = baseResponseSchema.extend({});
export type UpdatePatientSupportResponseSchema = z.infer<
  typeof updatePatientSupportResponseSchema
>;

//Delete

export const deletePatientSupportParamsSchema = z.object({
  id: z.string().uuid(),
});
export type DeletePatientSupportParamsSchema = z.infer<
  typeof deletePatientSupportParamsSchema
>;

export const disablePatientSupportResponseSchema = baseResponseSchema.extend(
  {},
);
export type DisablePatientSupportResponseSchema = z.infer<
  typeof disablePatientSupportResponseSchema
>;

export const deletePatientSupportResponseSchema = baseResponseSchema.extend({});
export type DeletePatientSupportResponseSchema = z.infer<
  typeof deletePatientSupportResponseSchema
>;
