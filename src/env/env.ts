import { z } from 'zod';

export const envSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['production', 'development', 'homolog', 'test']),
  APP_ENVIRONMENT: z.enum(['lambda', 'docker', 'local']),
  ENABLE_NEST_LOGS: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true'),
  MAINTENANCE: z.enum(['true', 'false']).transform((val) => val === 'true'),

  // API
  API_BASE_URL: z.url().optional(),
  API_PORT: z.coerce.number().default(3333),

  // APPs
  APP_URL: z.url(),
  DASHBOARD_URL: z.url(),
  DASHBOARD_KEY: z.string().min(1),

  // Secrets
  COOKIE_DOMAIN: z.string().min(1),
  COOKIE_SECRET: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  HASH_PEPPER: z.string().min(1),

  // Database
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number(),
  DB_DATABASE: z.string().min(1),
  DB_USERNAME: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_SCHEMA: z.string().optional(),

  // Observability
  SENTRY_DSN: z.string().optional().default(''),
  SENTRY_LOGS: z.enum(['all', 'error', 'none']),

  // Storage
  STORAGE_ENABLED: z.enum(['true', 'false']).transform((val) => val === 'true'),
  STORAGE_BUCKET_NAME: z.string().min(1),
  CDN_URL: z.url(),
  CDN_PUBLIC_KEY_ID: z.string().min(1),
  CDN_PRIVATE_KEY: z.string().min(1),

  // Signature
  SIGNATURE_ENABLED: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true'),
  SIGNATURE_MODEL_KEY: z.string().min(1),
  CLICKSIGN_API_URL: z.url(),
  CLICKSIGN_API_KEY: z.string().min(1),
  CLICKSIGN_WEBHOOK_SECRET: z.string().min(1),

  // Queues
  EMAIL_QUEUE_URL: z.url(),
  WHATSAPP_QUEUE_URL: z.url(),

  // AWS
  AWS_REGION: z.string().optional().default(''),
  AWS_ACCESS_KEY_ID: z.string().optional().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(''),
});

export type Env = z.infer<typeof envSchema>;
