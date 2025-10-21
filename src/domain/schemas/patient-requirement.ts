import { z } from 'zod';

export const TYPE_REQUIREMENT = ['document', 'form'] as const;
export type TypeRequirement = (typeof TYPE_REQUIREMENT)[number];

export const STATUS_REQUIREMENT = [
  'pending',
  'under_review',
  'approved',
  'declined',
] as const;
export type StatusRequirement = (typeof STATUS_REQUIREMENT)[number];

export const patientRequirementSchema = z
  .object({
    id: z.string().uuid(),
    patient_id: z.string().uuid(),
    type: z.enum(TYPE_REQUIREMENT).default('document'),
    title: z.string().max(255),
    description: z.string(),
    status: z.enum(STATUS_REQUIREMENT).default('pending'),
    required_by: z.string().uuid(),
    approved_by: z.string().uuid(),
    approved_at: z.coerce.date().nullable(),
    submitted_at: z.coerce.date().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type PatientRequirementSchema = z.infer<typeof patientRequirementSchema>;
