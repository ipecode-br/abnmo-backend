import { z } from 'zod';

import {
  WEBHOOK_EVENT_STATUSES,
  WEBHOOK_EVENT_TYPES,
} from '@/domain/enums/webhook-events';

import { baseEntitySchema } from '../base';

export const webhookEventSchema = z.strictObject({
  ...baseEntitySchema.shape,
  event: z.enum(WEBHOOK_EVENT_TYPES),
  status: z.enum(WEBHOOK_EVENT_STATUSES).default('received'),
  payload: z.record(z.string(), z.unknown()),
});
export type WebhookEventSchema = z.infer<typeof webhookEventSchema>;
