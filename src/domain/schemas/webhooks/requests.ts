import { z } from 'zod';

import {
  WEBHOOK_EVENT_STATUSES,
  WEBHOOK_EVENT_TYPES,
  WEBHOOK_EVENTS_ORDER_BY,
} from '@/domain/enums/webhook-events';

import {
  queryOrderSchema,
  queryPageSchema,
  queryPerPageSchema,
} from '../query';

export const getWebhookEventsQuerySchema = z.object({
  event: z.enum(WEBHOOK_EVENT_TYPES).optional(),
  status: z.enum(WEBHOOK_EVENT_STATUSES).optional(),
  orderBy: z.enum(WEBHOOK_EVENTS_ORDER_BY).optional().default('date'),
  order: queryOrderSchema.default('DESC'),
  page: queryPageSchema,
  perPage: queryPerPageSchema.default(20),
});
