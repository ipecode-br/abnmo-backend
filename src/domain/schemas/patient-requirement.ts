import { z } from 'zod';

import { baseResponseSchema } from './base';
import { patientSchema } from './patient';
import { baseQuerySchema } from './query';
import { userSchema } from './user';

export const PATIENT_REQUIREMENT_TYPE = [
  'screening',
  'medical_report',
] as const;
export type PatientRequirementType = (typeof PATIENT_REQUIREMENT_TYPE)[number];

export const PATIENT_REQUIREMENT_STATUS = [
  'pending',
  'under_review',
  'approved',
  'declined',
] as const;
export type PatientRequirementStatusType =
  (typeof PATIENT_REQUIREMENT_STATUS)[number];

export const PATIENT_REQUIREMENTS_ORDER_BY = [
  'name',
  'status',
  'type',
  'date',
  'approved_at',
  'submitted_at',
] as const;
export type PatientRequirementOrderBy =
  (typeof PATIENT_REQUIREMENTS_ORDER_BY)[number];

export const patientRequirementSchema = z
  .object({
    id: z.string().uuid(),
    patient_id: z.string().uuid(),
    type: z.enum(PATIENT_REQUIREMENT_TYPE),
    title: z.string().max(255),
    description: z.string().max(500).nullable(),
    status: z.enum(PATIENT_REQUIREMENT_STATUS).default('pending'),
    required_by: z.string().uuid(),
    approved_by: z.string().uuid().nullable(),
    approved_at: z.coerce.date().nullable(),
    submitted_at: z.coerce.date().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type PatientRequirementSchema = z.infer<typeof patientRequirementSchema>;

export const createPatientRequirementSchema = patientRequirementSchema.pick({
  patient_id: true,
  type: true,
  title: true,
  description: true,
});
export type CreatePatientRequirementSchema = z.infer<
  typeof createPatientRequirementSchema
>;

export const findAllPatientsRequirementsQuerySchema = baseQuerySchema
  .pick({
    search: true,
    order: true,
    startDate: true,
    endDate: true,
    perPage: true,
    page: true,
  })
  .extend({
    status: z.enum(PATIENT_REQUIREMENT_STATUS).optional(),
    orderBy: z
      .enum(PATIENT_REQUIREMENTS_ORDER_BY)
      .optional()
      .default('approved_at'),
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

export type findAllPatientsRequirementsQuerySchema = z.infer<
  typeof findAllPatientsRequirementsQuerySchema
>;

export const patientRequirementListItemSchema = patientRequirementSchema
  .pick({
    id: true,
    type: true,
    title: true,
    status: true,
    description: true,
    submitted_at: true,
    approved_at: true,
    created_at: true,
  })
  .extend({
    patient: patientSchema
      .pick({ id: true })
      .merge(userSchema.pick({ name: true })),
  });

export type PatientRequirementListItemSchema = z.infer<
  typeof patientRequirementListItemSchema
>;

export const findAllPatientsRequirementsResponseSchema =
  baseResponseSchema.extend({
    data: z.object({
      requirements: z.array(patientRequirementListItemSchema),
      total: z.number(),
    }),
  });
export type FindAllPatientsRequirementsResponseSchema = z.infer<
  typeof findAllPatientsRequirementsResponseSchema
>;

export const findAllPatientsRequirementsByPatientIdQuerySchema = baseQuerySchema
  .pick({
    startDate: true,
    endDate: true,
    perPage: true,
    page: true,
    limit: true,
  })
  .extend({
    status: z.enum(PATIENT_REQUIREMENT_STATUS).optional(),
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
export type FindAllPatientsRequirementsByPatientIdQuerySchema = z.infer<
  typeof findAllPatientsRequirementsByPatientIdQuerySchema
>;

export const patientRequirementByPatientIdResponseSchema =
  patientRequirementSchema.pick({
    id: true,
    type: true,
    title: true,
    status: true,
    submitted_at: true,
    approved_at: true,
    created_at: true,
  });
export type PatientRequirementByPatientIdResponseType = z.infer<
  typeof patientRequirementByPatientIdResponseSchema
>;

export const findAllPatientsRequirementsByPatientIdResponseSchema =
  baseResponseSchema.extend({
    data: z.object({
      requirements: z.array(patientRequirementByPatientIdResponseSchema),
      total: z.number(),
    }),
  });
export type FindAllPatientsRequirementsByPatientIdResponseSchema = z.infer<
  typeof findAllPatientsRequirementsByPatientIdResponseSchema
>;
