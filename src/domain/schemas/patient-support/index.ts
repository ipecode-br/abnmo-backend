import { z } from 'zod';

import { nameSchema, phoneSchema } from '../shared';

export const patientSupportSchema = z
  .object({
    id: z.string().uuid(),
    patient_id: z.string().uuid(),
    name: nameSchema,
    phone: phoneSchema,
    kinship: z.string().max(32),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type PatientSupportSchema = z.infer<typeof patientSupportSchema>;
