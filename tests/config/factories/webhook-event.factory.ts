import { faker } from '@faker-js/faker';

import { WebhookEvent } from '@/domain/entities/webhook-event';
import {
  WEBHOOK_EVENT_STATUSES,
  WEBHOOK_EVENT_TYPES,
} from '@/domain/enums/webhook-events';

import { baseEntityFactory } from './shared.factory';

export function webhookEventFactory(
  overrides: Partial<WebhookEvent> = {},
): WebhookEvent {
  return {
    ...baseEntityFactory(),
    event: faker.helpers.arrayElement(WEBHOOK_EVENT_TYPES),
    status: faker.helpers.arrayElement(WEBHOOK_EVENT_STATUSES),
    payload: { key: faker.string.uuid(), name: faker.lorem.word() },
    ...overrides,
  } as WebhookEvent;
}
