import { z } from 'zod';

export const baseEntitySchema = z
  .object({
    id: z.string().uuid(),
    updatedAt: z.coerce.date(),
    createdAt: z.coerce.date(),
  })
  .strict();

export const baseResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
  })
  .strict();
