import { z } from 'zod';

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

export const STATUS = ['active', 'inactive', 'ACTIVE', 'INACTIVE'] as const;
export type StatusType = (typeof STATUS)[number];

export const ORDER = ['ASC', 'DESC'] as const;
export type OrderType = (typeof ORDER)[number];

export const ORDERBY = ['name', 'status', 'date'] as const;
export type OrderByType = (typeof ORDERBY)[number];

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
    state: z.string().min(2).max(2),
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

export const createPatientSchema = patientSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type CreatePatientSchema = z.infer<typeof createPatientSchema>;

export const createPatientResponseSchema = baseResponseSchema.extend({});
export type CreatePatientResponseSchema = z.infer<
  typeof createPatientResponseSchema
>;

export const findAllPatientSchema = z
  .object({
    search: z.union([z.coerce.string().min(1), z.string().email()]).optional(),
    order: z.enum(ORDER).optional(),
    orderBy: z.enum(ORDERBY).optional(),
    status: z.enum(STATUS).optional(),
    startDate: z
      .string()
      .refine((val) => !isNaN(new Date(val).getTime()), {
        message: 'Formato de data inválido',
      })
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(new Date(val).getTime()), {
        message: 'Formato de data inválido',
      })
      .optional(),
    page: z.coerce.number().int().positive().min(1).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'A data final deve ser maior ou igual à data inicial',
      path: ['endDate'],
    },
  );
export type FindAllPatientSchema = z.infer<typeof findAllPatientSchema>;

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
