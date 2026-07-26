import { WebhookEvent } from '@/domain/entities/webhook-event';

import { webhookEventFactory } from '../config/factories/webhook-event.factory';
import { getTestDataSource } from '../config/setup-e2e';

export async function createWebhookEvent(
  overrides: Partial<WebhookEvent> = {},
): Promise<WebhookEvent> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(WebhookEvent);
  const webhookEvent = repo.create(webhookEventFactory(overrides));

  await repo.save(webhookEvent);

  return webhookEvent;
}

export async function getWebhookEventById(
  id: string,
): Promise<WebhookEvent | null> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(WebhookEvent);
  return await repo.findOne({ where: { id } });
}
