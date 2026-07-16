import { z } from 'zod';

import { dateSchema } from './shared';

export const baseEntitySchema = z
  .object({
    id: z.string().uuid(),
    updatedAt: dateSchema,
    createdAt: dateSchema,
  })
  .strict();
export type BaseEntitySchema = z.infer<typeof baseEntitySchema>;

export const baseResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
  })
  .strict();
