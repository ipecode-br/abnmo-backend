import { z } from 'zod';

import { baseEntitySchema } from './base';
import { dateSchema } from './shared';
import { userSchema } from './users';

export const sessionSchema = baseEntitySchema
  .extend({
    userId: userSchema.shape.id,
    tokenHash: z.string().length(64),
    expiresAt: dateSchema,
  })
  .strict();
export type SessionSchema = z.infer<typeof sessionSchema>;
