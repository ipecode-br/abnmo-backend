import { Column, Entity } from 'typeorm';

import {
  WEBHOOK_EVENT_STATUSES,
  WEBHOOK_EVENT_TYPES,
  type WebhookEventStatus,
  WebhookEventType,
} from '../enums/webhook-events';
import type { WebhookEventSchema } from '../schemas/webhooks';
import { BaseEntity } from './base';

@Entity('webhooks_events')
export class WebhookEvent extends BaseEntity implements WebhookEventSchema {
  @Column({ type: 'enum', enum: WEBHOOK_EVENT_TYPES })
  event: WebhookEventType;

  @Column({ type: 'enum', enum: WEBHOOK_EVENT_STATUSES, default: 'received' })
  status: WebhookEventStatus;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;
}
