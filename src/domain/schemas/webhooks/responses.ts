import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { webhookEventSchema } from '.';

export const webhookEventResponseSchema = webhookEventSchema.pick({
  id: true,
  event: true,
  status: true,
  createdAt: true,
});
export type WebhookResponseSchema = z.infer<typeof webhookEventResponseSchema>;

export const getWebhookEventsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    events: z.array(webhookEventResponseSchema),
    total: z.number(),
  }),
});
