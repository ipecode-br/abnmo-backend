import { z } from 'zod';

import { baseEntitySchema } from './base';

export const sessionSchema = baseEntitySchema
  .extend({
    tokenHash: z.string().length(64),
    userId: z.string().uuid(),
    expiresAt: z.coerce.date(),
  })
  .strict();
export type SessionSchema = z.infer<typeof sessionSchema>;
