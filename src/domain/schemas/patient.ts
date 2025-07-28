import { z } from 'zod';

import { BRAZILIAN_STATES } from '@/constants/brazilian-states';

import { baseResponseSchema } from './base';
import { baseQuerySchema } from './query';

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

export const STATUS = ['active', 'inactive'] as const;
export type StatusType = (typeof STATUS)[number];

export const ORDER_BY = ['name', 'status', 'date'] as const;
export type OrderByType = (typeof ORDER_BY)[number];

export const patientSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
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
    status: z.enum(STATUS).default('active'),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type PatientSchema = z.infer<typeof patientSchema>;

export const createPatientSchema = patientSchema
  .omit({ id: true, created_at: true, updated_at: true })
  .extend({
    user_id: z.string().uuid().optional(),
    name: z.string().optional(),
    email: z.string().email().optional(),
  })
  .refine(
    (data) => {
      const hasNameAndEmail = !!data.name && !!data.email;
      if (!data.user_id && !hasNameAndEmail) {
        return false;
      }
      if (data.user_id) {
        data.name = undefined;
        data.email = undefined;
      }
      return true;
    },
    {
      message:
        'Fields `name` and `email` are required when `user_id` is not provided.',
      path: ['root'],
    },
  );
export type CreatePatientSchema = z.infer<typeof createPatientSchema>;

export const createPatientResponseSchema = baseResponseSchema.extend({});
export type CreatePatientResponseSchema = z.infer<
  typeof createPatientResponseSchema
>;

export const findAllPatientsQuerySchema = baseQuerySchema
  .pick({ search: true, order: true, page: true })
  .extend({
    status: z.enum(STATUS).optional(),
    orderBy: z.enum(ORDER_BY).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate < data.endDate;
      }
      return true;
    },
    {
      message: 'It should be greater than `startDate`',
      path: ['endDate'],
    },
  );
export type FindAllPatientsQuerySchema = z.infer<
  typeof findAllPatientsQuerySchema
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
