import { z } from 'zod';

import { baseEntitySchema } from './base';
import { datetimeSchema } from './shared';

export const sessionSchema = baseEntitySchema
  .extend({
    tokenHash: z.string().length(64),
    expiresAt: datetimeSchema,
  })
  .strict();
export type SessionSchema = z.infer<typeof sessionSchema>;
