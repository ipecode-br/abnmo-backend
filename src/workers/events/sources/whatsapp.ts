import * as Sentry from '@sentry/node';

import { checkIsProcessed, markProcessed } from '@/shared/queue/utils';

import { logger } from '../logger';
import type {
  EventContext,
  WhatsAppEvent,
  WhatsAppStatus,
  WhatsAppWebhookEntry,
} from '../types';

function reportStatus(
  status: WhatsAppStatus,
  event: WhatsAppEvent,
  context: EventContext,
): void {
  const recipient = status.recipient_id ? `+${status.recipient_id}` : undefined;

  if (!status.status.toLowerCase().includes('failed')) {
    logger.info('WhatsApp message status received', {
      wamid: status.id,
      status: status.status,
      recipient,
      statusTimestamp: status.timestamp,
      awsMessageId: event.messageId,
      snsMessageId: context.sns.MessageId,
    });

    return;
  }

  const failure = status.errors?.[0];

  logger.error('WhatsApp message delivery failed', {
    wamid: status.id,
    status: status.status,
    recipient,
    statusTimestamp: status.timestamp,
    awsMessageId: event.messageId,
    snsMessageId: context.sns.MessageId,
    metaErrorCode: failure?.code,
    metaErrorTitle: failure?.title,
    metaErrorMessage: failure?.message,
    metaErrorDetails: failure?.error_data?.details,
  });

  Sentry.captureMessage(
    `WhatsApp message delivery failed${failure?.code ? ` (Meta ${failure.code})` : ''}`,
    {
      level: 'error',
      tags: {
        worker: 'events',
        source: 'whatsapp',
      },
      extra: {
        wamid: status.id,
        status: status.status,
        recipient,
        awsMessageId: event.messageId,
        snsMessageId: context.sns.MessageId,
        metaErrorCode: failure?.code,
        metaErrorTitle: failure?.title,
        metaErrorMessage: failure?.message,
        metaErrorDetails: failure?.error_data?.details,
      },
    },
  );
}

export function handleWhatsAppEvent(
  payload: Record<string, unknown>,
  context: EventContext,
): void {
  const event = payload as unknown as WhatsAppEvent;

  const webhookEntry =
    typeof event.whatsAppWebhookEntry === 'string'
      ? (JSON.parse(event.whatsAppWebhookEntry) as WhatsAppWebhookEntry)
      : event.whatsAppWebhookEntry;

  const statuses = webhookEntry.changes.flatMap(
    (change) => change.value.statuses ?? [],
  );

  for (const status of statuses) {
    const dedupKey = `${status.id}:${status.status}`;

    if (checkIsProcessed(dedupKey, context.processedKeys)) {
      continue;
    }

    reportStatus(status, event, context);

    markProcessed(dedupKey, context.processedKeys);
  }
}
