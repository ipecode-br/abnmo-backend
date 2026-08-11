import 'dotenv/config';

import { z } from 'zod';

export const emailWorkerEnvSchema = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']).optional(),

  SQS_EMAIL_MAX_RECEIVE_COUNT: z.coerce.number().default(3),
  EMAIL_PROVIDER: z.enum(['ses', 'resend', 'none']),
  RESEND_KEY: z.string().min(1),

  SENTRY_DSN: z.string().optional().default(''),
  SENTRY_LOGS: z.enum(['all', 'error', 'none']).default('none'),
});

export type EmailWorkerEnv = z.infer<typeof emailWorkerEnvSchema>;

export const env = emailWorkerEnvSchema.parse(process.env);
