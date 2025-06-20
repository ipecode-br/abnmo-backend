import { z } from 'zod';

export const envSchema = z.object({
  APP_URL: z.string().url(),

  // API
  API_BASE_URL: z.string().url(),
  API_PORT: z.coerce.number().default(3333),
  API_ENVIRONMENT: z
    .enum(['production', 'development', 'homolog', 'local'])
    .default('local'),
  NODE_ENV: z
    .enum(['production', 'development', 'test'])
    .default('development'),

  // Secrets
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECRET: z.string().min(1),
  JWT_SECRET: z.string().min(1),

  // Database
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number(),
  DB_DATABASE: z.string().min(1),
  DB_USERNAME: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;
