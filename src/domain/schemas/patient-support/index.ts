import { z } from 'zod';

import { nameSchema, phoneSchema } from '../shared';

export const patientSupportSchema = z
  .object({
    id: z.string().uuid(),
    patientId: z.string().uuid(),
    name: nameSchema,
    phone: phoneSchema,
    kinship: z.string().max(32),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strict();
export type PatientSupportSchema = z.infer<typeof patientSupportSchema>;
