import { z } from 'zod';

import { BRAZILIAN_STATES } from '@/constants/brazilian-states';

import { baseResponseSchema } from './base';

// Entity

export const GENDERS = [
  'male_cis',
  'female_cis',
  'male_trans',
  'female_trans',
  'non_binary',
  'prefer_not_to_say',
] as const;
export type GenderType = (typeof GENDERS)[number];
export const STATUS = ['active', 'inactive'] as const;
export type StatusType = (typeof STATUS)[number];

export const patientSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    gender: z.enum(GENDERS).default('prefer_not_to_say'),
    date_of_birth: z.coerce.date(),
    phone: z
      .string()
      .regex(/^\d+$/)
      .refine((num) => num.length === 11),
    cpf: z.string().min(11).max(11),
    state: z.enum(BRAZILIAN_STATES),
    city: z.string(),
    // medical report
    has_disability: z.boolean().default(false),
    disability_desc: z.string().nullable(),
    need_legal_assistance: z.boolean().default(false),
    take_medication: z.boolean().default(false),
    medication_desc: z.string().nullable(),
    has_nmo_diagnosis: z.boolean().default(false),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type PatientSchema = z.infer<typeof patientSchema>;

export const createPatientSchema = z
  .object({
    user_id: z.string().uuid().optional(),

    email: z.string().email().optional(),
    name: z.string().optional(),

    gender: z.enum(GENDERS).default('prefer_not_to_say'),
    date_of_birth: z.coerce.date(),
    phone: z
      .string()
      .regex(/^\d+$/)
      .refine((num) => num.length === 11),
    cpf: z.string().min(11).max(11),
    state: z.enum(BRAZILIAN_STATES),
    city: z.string(),
    has_disability: z.boolean().default(false),
    disability_desc: z.string().nullable(),
    need_legal_assistance: z.boolean().default(false),
    take_medication: z.boolean().default(false),
    medication_desc: z.string().nullable(),
    has_nmo_diagnosis: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.user_id) {
      if (!data.email) {
        ctx.addIssue({
          path: ['email'],
          code: z.ZodIssueCode.custom,
          message: 'Email é obrigatório quando não fornecer user_id',
        });
      }
      if (!data.name) {
        ctx.addIssue({
          path: ['name'],
          code: z.ZodIssueCode.custom,
          message: 'Name é obrigatório quando não fornecer user_id',
        });
      }
    }
  });
export type CreatePatientSchema = z.infer<typeof createPatientSchema>;

export const createPatientResponseSchema = baseResponseSchema.extend({});
export type CreatePatientResponseSchema = z.infer<
  typeof createPatientResponseSchema
>;

export const findAllPatientsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    patients: z.array(patientSchema),
    total: z.number(),
  }),
});
export type FindAllPatientsResponseSchema = z.infer<
  typeof findAllPatientsResponseSchema
>;

export const findOnePatientResponseSchema = baseResponseSchema.extend({
  data: patientSchema,
});
export type FindOnePatientResponseSchema = z.infer<
  typeof findOnePatientResponseSchema
>;

export const deletePatientResponseSchema = baseResponseSchema.extend({});
export type DeletePatientResponseSchema = z.infer<
  typeof deletePatientResponseSchema
>;

export const inactivatePatientResponseSchema = baseResponseSchema.extend({});
export type InactivatePatientResponseSchema = z.infer<
  typeof inactivatePatientResponseSchema
>;
