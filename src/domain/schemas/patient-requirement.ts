import { z } from 'zod';

import { baseResponseSchema } from './base';
import { baseQuerySchema } from './query';

export const PATIENT_REQUIREMENT_TYPE = ['document', 'form'] as const;
export type PatientRequirementType = (typeof PATIENT_REQUIREMENT_TYPE)[number];

export const PATIENT_REQUIREMENT_STATUS = [
  'pending',
  'under_review',
  'approved',
  'declined',
] as const;
export type PatientRequirementStatusType =
  (typeof PATIENT_REQUIREMENT_STATUS)[number];

export const patientRequirementSchema = z
  .object({
    id: z.string().uuid(),
    patient_id: z.string().uuid(),
    type: z.enum(PATIENT_REQUIREMENT_TYPE).default('document'),
    title: z.string().max(255),
    description: z.string().max(500),
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

export const findAllPatientsRequirementsByIdQuerySchema = baseQuerySchema
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
export type FindAllPatientsRequirementsByIdQuerySchema = z.infer<
  typeof findAllPatientsRequirementsByIdQuerySchema
>;

export const patientRequirementResponseSchema = patientRequirementSchema.pick({
  id: true,
  type: true,
  title: true,
  status: true,
  submitted_at: true,
  approved_at: true,
  created_at: true,
});
export type PatientRequirementTypeList = z.infer<
  typeof patientRequirementResponseSchema
>;

export const findAllPatientsRequirementsResponseSchema =
  baseResponseSchema.extend({
    data: z.object({
      requests: z.array(patientRequirementResponseSchema),
      total: z.number(),
    }),
  });
export type FindAllPatientsRequirementsResponseSchema = z.infer<
  typeof findAllPatientsRequirementsResponseSchema
>;
