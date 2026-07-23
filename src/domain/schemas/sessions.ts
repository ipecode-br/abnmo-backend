import { z } from 'zod';

import { baseEntitySchema } from './base';
import { datetimeSchema } from './shared';

export const sessionSchema = z.strictObject({
  ...baseEntitySchema.shape,
  tokenHash: z.string().length(64),
  expiresAt: datetimeSchema,
});
export type SessionSchema = z.infer<typeof sessionSchema>;
