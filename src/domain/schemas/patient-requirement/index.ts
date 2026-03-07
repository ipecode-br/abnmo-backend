import { z } from 'zod';

import {
  PATIENT_REQUIREMENT_STATUSES,
  PATIENT_REQUIREMENT_TYPES,
} from '@/domain/enums/patient-requirements';

export const patientRequirementSchema = z
  .object({
    id: z.string().uuid(),
    patientId: z.string().uuid(),
    type: z.enum(PATIENT_REQUIREMENT_TYPES),
    title: z.string().max(255),
    description: z.string().max(500).nullable(),
    status: z.enum(PATIENT_REQUIREMENT_STATUSES).default('pending'),
    submittedAt: z.coerce.date().nullable(),
    approvedBy: z.string().uuid().nullable(),
    approvedAt: z.coerce.date().nullable(),
    declinedBy: z.string().uuid().nullable(),
    declinedAt: z.coerce.date().nullable(),
    createdBy: z.string().uuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strict();
export type PatientRequirementSchema = z.infer<typeof patientRequirementSchema>;
