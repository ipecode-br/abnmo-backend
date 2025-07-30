import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['production', 'development', 'test'])
    .default('development'),

  // API
  API_BASE_URL: z.string().url().optional(),
  API_PORT: z.coerce.number().default(3333),

  // APP
  APP_URL: z.string().url(),
  APP_ENVIRONMENT: z
    .enum(['production', 'development', 'homolog', 'local'])
    .default('local'),

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

  // AWS
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_SES_FROM_EMAIL: z.string().email(),
});

export type Env = z.infer<typeof envSchema>;
