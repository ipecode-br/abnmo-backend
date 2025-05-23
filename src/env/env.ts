import { z } from 'zod';

export const envSchema = z.object({
  // API
  API_BASE_URL: z.string().url(),
  API_PORT: z.coerce.number().min(1),

  // Database
  DB_HOST: z.string().min(1),
  DB_EXTERNAL_PORT: z.coerce.number(),
  DB_DATABASE: z.string().min(1),
  DB_ROOT_PASSWORD: z.string().min(1),
  DB_USERNAME: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;
