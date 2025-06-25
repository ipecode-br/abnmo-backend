import { z } from 'zod';

// Entity

export const patientSupportSchema = z
  .object({
    id: z.string().uuid(),
    patient_id: z.string().uuid(),
    name: z.string().min(3),
    phone: z.string(),
    kinship: z.string(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type PatientSuppoprtSchema = z.infer<typeof patientSupportSchema>;
