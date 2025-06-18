import { z } from 'zod';

import { baseResponseSchema } from '../base';

export const createUserResponseSchema = baseResponseSchema.extend({});
export type CreateUserResponseSchema = z.infer<typeof createUserResponseSchema>;

export const updateUserResponseSchema = baseResponseSchema.extend({});
export type UpdateUserResponseSchema = z.infer<typeof updateUserResponseSchema>;
