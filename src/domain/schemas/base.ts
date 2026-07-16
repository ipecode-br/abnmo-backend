import { z } from 'zod';

import { datetimeSchema } from './shared';

export const baseEntitySchema = z
  .object({
    id: z.string().uuid(),
    updatedAt: datetimeSchema,
    createdAt: datetimeSchema,
  })
  .strict();
export type BaseEntitySchema = z.infer<typeof baseEntitySchema>;

export const baseResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
  })
  .strict();
