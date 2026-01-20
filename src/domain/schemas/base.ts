import { z } from 'zod';

export const baseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
