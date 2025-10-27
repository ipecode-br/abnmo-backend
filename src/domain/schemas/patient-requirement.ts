import { z } from 'zod';

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

export const createPatientRequirementSchema = patientRequirementSchema.pick({
  patient_id: true,
  type: true,
  title: true,
  description: true,
  required_by: true,
});
export type CreatePatientRequirementDto = z.infer<
  typeof createPatientRequirementSchema
>;
