import { z } from 'zod';

import { datetimeSchema, uuidSchema } from './shared';

export const baseEntitySchema = z.strictObject({
  id: uuidSchema,
  updatedAt: datetimeSchema,
  createdAt: datetimeSchema,
});
export type BaseEntitySchema = z.infer<typeof baseEntitySchema>;

export const baseResponseSchema = z.strictObject({
  success: z.boolean(),
  message: z.string(),
});
