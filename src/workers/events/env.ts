import 'dotenv/config';

import { z } from 'zod';

export const eventsWorkerEnvSchema = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']).optional(),

  SQS_EVENTS_MAX_RECEIVE_COUNT: z.coerce.number().default(5),
  SNS_TOPIC_ARN_WHATSAPP: z.string().optional().default(''),

  SENTRY_DSN: z.string().optional().default(''),
  SENTRY_LOGS: z.enum(['all', 'error', 'none']).default('none'),
});

export type EventsWorkerEnv = z.infer<typeof eventsWorkerEnvSchema>;

export const env = eventsWorkerEnvSchema.parse(process.env);
