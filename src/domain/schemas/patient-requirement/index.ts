import { z } from 'zod';

import {
  PATIENT_REQUIREMENT_STATUSES,
  PATIENT_REQUIREMENT_TYPES,
} from '@/domain/enums/patient-requirements';

export const patientRequirementSchema = z
  .object({
    id: z.string().uuid(),
    patient_id: z.string().uuid(),
    type: z.enum(PATIENT_REQUIREMENT_TYPES),
    title: z.string().max(255),
    description: z.string().max(500).nullable(),
    status: z.enum(PATIENT_REQUIREMENT_STATUSES).default('pending'),
    submitted_at: z.coerce.date().nullable(),
    approved_by: z.string().uuid().nullable(),
    approved_at: z.coerce.date().nullable(),
    created_by: z.string().uuid(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type PatientRequirementSchema = z.infer<typeof patientRequirementSchema>;
