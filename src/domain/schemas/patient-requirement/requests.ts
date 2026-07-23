import { z } from 'zod';

import {
  PATIENT_REQUIREMENT_STATUSES,
  PATIENT_REQUIREMENTS_ORDER_BY,
} from '@/domain/enums/patient-requirements';

import { patientSchema } from '../patients';
import {
  queryDateSchema,
  queryLimitSchema,
  queryOrderSchema,
  queryPageSchema,
  queryPerPageSchema,
  querySearchSchema,
  validateEndDate,
} from '../query';
import { patientRequirementSchema } from '.';

export const createPatientRequirementSchema = patientRequirementSchema
  .pick({
    type: true,
    title: true,
    description: true,
  })
  .extend({ patientId: patientSchema.shape.id });

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
  .superRefine(validateEndDate);

export const getPatientRequirementsByPatientIdQuerySchema = z
  .object({
    status: z.enum(PATIENT_REQUIREMENT_STATUSES).optional(),
    startDate: queryDateSchema.optional(),
    endDate: queryDateSchema.optional(),
    page: queryPageSchema,
    perPage: queryPerPageSchema,
    limit: queryLimitSchema,
  })
  .superRefine(validateEndDate);
