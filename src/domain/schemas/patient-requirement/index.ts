import { z } from 'zod';

import {
  PATIENT_REQUIREMENT_STATUSES,
  PATIENT_REQUIREMENT_TYPES,
} from '@/domain/enums/patient-requirements';

import { baseEntitySchema } from '../base';
import { uuidSchema } from '../shared';

export const patientRequirementSchema = z.strictObject({
  ...baseEntitySchema.shape,
  title: z.string().max(255),
  description: z.string().max(500).nullable(),
  status: z.enum(PATIENT_REQUIREMENT_STATUSES).default('pending'),
  type: z.enum(PATIENT_REQUIREMENT_TYPES),
  submittedAt: z.date().nullable(),
  updatedBy: uuidSchema.nullable(),
  createdBy: uuidSchema,
});
export type PatientRequirementSchema = z.infer<typeof patientRequirementSchema>;
