import { z } from 'zod';

import {
  PATIENT_REQUIREMENT_STATUSES,
  PATIENT_REQUIREMENTS_ORDER_BY,
} from '@/domain/enums/patient-requirements';

import { baseQuerySchema } from '../query';
import { patientRequirementSchema } from '.';

export const createPatientRequirementSchema = patientRequirementSchema.pick({
  patient_id: true,
  type: true,
  title: true,
  description: true,
});
export type CreatePatientRequirement = z.infer<
  typeof createPatientRequirementSchema
>;

export const getPatientRequirementsQuerySchema = baseQuerySchema
  .pick({
    search: true,
    order: true,
    startDate: true,
    endDate: true,
    perPage: true,
    page: true,
  })
  .extend({
    status: z.enum(PATIENT_REQUIREMENT_STATUSES).optional(),
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
export type GetPatientRequirementsQuery = z.infer<
  typeof getPatientRequirementsQuerySchema
>;

export const getPatientRequirementsByPatientIdQuerySchema = baseQuerySchema
  .pick({
    startDate: true,
    endDate: true,
    perPage: true,
    page: true,
    limit: true,
  })
  .extend({ status: z.enum(PATIENT_REQUIREMENT_STATUSES).optional() })
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
export type GetPatientRequirementsByPatientIdQuery = z.infer<
  typeof getPatientRequirementsByPatientIdQuerySchema
>;
