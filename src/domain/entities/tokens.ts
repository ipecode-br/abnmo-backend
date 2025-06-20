import { z } from 'zod';

export const authToken = z.enum(['access_token', 'password_reset']);

export type AuthToken = z.infer<typeof authToken>;
