import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { userSchema } from '.';

export const getUserResponseSchema = baseResponseSchema.extend({
  data: userSchema.omit({ password: true }),
});
export type GetUserResponse = z.infer<typeof getUserResponseSchema>;
