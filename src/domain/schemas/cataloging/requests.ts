import { z } from 'zod';

import { emailSchema, nameSchema, phoneSchema } from '../shared';

export const createCatalogingSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
  })
  .strict();
export type CreateCatalogingSchema = z.infer<typeof createCatalogingSchema>;
