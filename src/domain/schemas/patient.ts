import { z } from 'zod';

import { BRAZILIAN_STATES } from '@/constants/brazilian-states';
import { ONLY_NUMBERS_REGEX } from '@/constants/regex';

import { baseResponseSchema } from './base';
import { createPatientSupportSchema } from './patient-support';
import { patientSupportSchema } from './patient-support';
import { baseQuerySchema } from './query';
import { userSchema } from './user';

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

export const PATIENT_STATUS = ['active', 'inactive'] as const;
export type PatientStatusType = (typeof PATIENT_STATUS)[number];

export const PATIENT_ORDER_BY = ['name', 'email', 'status', 'date'] as const;
export type PatientOrderByType = (typeof PATIENT_ORDER_BY)[number];

export const PATIENT_STATISTICS = ['gender', 'total'] as const;
export type PatientStatisticsResult = {
  gender: GenderType;
  total: number;
};

export const patientSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    gender: z.enum(GENDERS).default('prefer_not_to_say'),
    date_of_birth: z.coerce.date(),
    phone: z
      .string()
      .min(10)
      .max(11)
      .regex(ONLY_NUMBERS_REGEX, 'Only numbers are accepted'),
    cpf: z.string().max(11),
    state: z.enum(BRAZILIAN_STATES),
    city: z.string(),
    // medical report
    has_disability: z.boolean().default(false),
    disability_desc: z.string().nullable(),
    need_legal_assistance: z.boolean().default(false),
    take_medication: z.boolean().default(false),
    medication_desc: z.string().nullable(),
    has_nmo_diagnosis: z.boolean().default(false),
    status: z.enum(PATIENT_STATUS).default('active'),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type PatientSchema = z.infer<typeof patientSchema>;

export const patientResponseSchema = patientSchema
  .merge(
    userSchema.pick({
      name: true,
      email: true,
      avatar_url: true,
    }),
  )
  .extend({
    supports: z.array(
      patientSupportSchema.pick({
        id: true,
        name: true,
        phone: true,
        kinship: true,
      }),
    ),
  });
export type PatientType = z.infer<typeof patientResponseSchema>;

export const patientScreeningSchema = patientSchema
  .omit({
    id: true,
    user_id: true,
    status: true,
    created_at: true,
    updated_at: true,
  })
  .merge(userSchema.pick({ name: true }))
  .extend({
    supports: z
      .array(
        createPatientSupportSchema.pick({
          name: true,
          phone: true,
          kinship: true,
        }),
      )
      .nullable()
      .default([]),
  });
export type PatientScreeningSchema = z.infer<typeof patientScreeningSchema>;

export const createPatientSchema = patientSchema
  .omit({ id: true, created_at: true, updated_at: true })
  .merge(userSchema.pick({ name: true, email: true }))
  .extend({
    supports: z
      .array(
        createPatientSupportSchema.pick({
          name: true,
          phone: true,
          kinship: true,
        }),
      )
      .optional()
      .default([]),
  });
export type CreatePatientSchema = z.infer<typeof patientScreeningSchema>;

export const updatePatientSchema = patientSchema
  .omit({
    id: true,
    user_id: true,
    created_at: true,
    updated_at: true,
    status: true,
  })
  .merge(userSchema.pick({ name: true, email: true }));

export type UpdatePatientSchema = z.infer<typeof updatePatientSchema>;

export const findAllPatientsQuerySchema = baseQuerySchema
  .pick({ search: true, order: true, page: true })
  .extend({
    status: z.enum(PATIENT_STATUS).optional(),
    orderBy: z.enum(PATIENT_ORDER_BY).optional().default('name'),
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
    patients: z.array(patientResponseSchema),
    total: z.number(),
  }),
});
export type FindAllPatientsResponseSchema = z.infer<
  typeof findAllPatientsResponseSchema
>;

export const getPatientResponseSchema = baseResponseSchema.extend({
  data: patientResponseSchema,
});
export type GetPatientResponseSchema = z.infer<typeof getPatientResponseSchema>;
