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

export const webhookEventDetailsResponseSchema = webhookEventSchema.pick({
  id: true,
  event: true,
  status: true,
  payload: true,
  updatedAt: true,
  createdAt: true,
});
export type WebhookEventDetailsResponse = z.infer<
  typeof webhookEventDetailsResponseSchema
>;

export const getWebhookEventResponseSchema = baseResponseSchema.extend({
  data: webhookEventDetailsResponseSchema,
});
