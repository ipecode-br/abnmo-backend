import { z } from 'zod';

import { uuidSchema } from './shared';

export const baseEntitySchema = z.strictObject({
  id: uuidSchema,
  updatedAt: z.date(),
  createdAt: z.date(),
});
export type BaseEntitySchema = z.infer<typeof baseEntitySchema>;

export const baseResponseSchema = z.strictObject({
  success: z.boolean(),
  message: z.string(),
});
