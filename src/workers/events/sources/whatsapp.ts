import * as Sentry from '@sentry/node';

import { checkIsProcessed, markProcessed } from '@/shared/queue/utils';
import { anonymizePhoneE164 } from '@/utils/anonymize';
import { debugLog } from '@/utils/debug-log';

import { logger } from '../logger';
import { whatsAppEventSchema, whatsAppWebhookEntrySchema } from '../schemas';
import type { EventContext } from '../types';

export function handleWhatsAppEvent(
  payload: Record<string, unknown>,
  context: EventContext,
): void {
  const event = whatsAppEventSchema.parse(payload);

  const webhookEntry = whatsAppWebhookEntrySchema.parse(
    JSON.parse(event.whatsAppWebhookEntry),
  );

  const statuses = webhookEntry.changes.flatMap(
    (change) => change.value.statuses ?? [],
  );

  debugLog('whatsapp statuses parsed', {
    snsMessageId: context.sns.MessageId,
    statusCount: statuses.length,
    statuses: statuses.map((status) => ({
      wamid: status.id,
      status: status.status,
    })),
  });

  for (const status of statuses) {
    const dedupKey = `${status.id}:${status.status}`;

    if (checkIsProcessed(dedupKey, context.processedKeys)) {
      debugLog('whatsapp status duplicate skipped', {
        wamid: status.id,
        status: status.status,
      });
      continue;
    }

    const recipient = status.recipient_id
      ? anonymizePhoneE164(`+${status.recipient_id}`)
      : undefined;

    if (status.status === 'failed') {
      const failure = status.errors?.[0];

      logger.error('WhatsApp message delivery failed', {
        wamid: status.id,
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
    } else {
      logger.info('WhatsApp message status received', {
        wamid: status.id,
        status: status.status,
        recipient,
        statusTimestamp: status.timestamp,
        awsMessageId: event.messageId,
        snsMessageId: context.sns.MessageId,
      });
    }

    markProcessed(dedupKey, context.processedKeys);
  }
}
