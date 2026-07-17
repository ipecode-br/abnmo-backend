import { z } from 'zod';

import { baseEntitySchema } from './base';

export const sessionSchema = z.strictObject({
  ...baseEntitySchema.shape,
  tokenHash: z.string().length(64),
  expiresAt: z.date(),
});
export type SessionSchema = z.infer<typeof sessionSchema>;
