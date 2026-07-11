import { z } from 'zod';

import {
  PATIENT_REQUIREMENT_STATUSES,
  PATIENT_REQUIREMENTS_ORDER_BY,
} from '@/domain/enums/patient-requirements';

import {
  queryDateSchema,
  queryLimitSchema,
  queryOrderSchema,
  queryPageSchema,
  queryPerPageSchema,
  querySearchSchema,
} from '../query';
import { patientRequirementSchema } from '.';

export const createPatientRequirementSchema = patientRequirementSchema.pick({
  patientId: true,
  type: true,
  title: true,
  description: true,
});

export const getPatientRequirementsQuerySchema = z
  .object({
    search: querySearchSchema.optional(),
    status: z.enum(PATIENT_REQUIREMENT_STATUSES).optional(),
    orderBy: z.enum(PATIENT_REQUIREMENTS_ORDER_BY).optional().default('date'),
    order: queryOrderSchema.default('DESC'),
    startDate: queryDateSchema.optional(),
    endDate: queryDateSchema.optional(),
    page: queryPageSchema,
    perPage: queryPerPageSchema,
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

export const getPatientRequirementsByPatientIdQuerySchema = z
  .object({
    status: z.enum(PATIENT_REQUIREMENT_STATUSES).optional(),
    startDate: queryDateSchema.optional(),
    endDate: queryDateSchema.optional(),
    page: queryPageSchema,
    perPage: queryPerPageSchema,
    limit: queryLimitSchema,
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
