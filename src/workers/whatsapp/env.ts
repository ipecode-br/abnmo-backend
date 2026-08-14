import 'dotenv/config';

import { z } from 'zod';

export const whatsappWorkerEnvSchema = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']).optional(),

  SQS_WHATSAPP_MAX_RECEIVE_COUNT: z.coerce.number().default(5),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
  WHATSAPP_META_API_VERSION: z.string().min(1),

  SENTRY_DSN: z.string().optional().default(''),
  SENTRY_LOGS: z.enum(['all', 'error', 'none']).default('none'),
});

export type WhatsappWorkerEnv = z.infer<typeof whatsappWorkerEnvSchema>;

export const env = whatsappWorkerEnvSchema.parse(process.env);
