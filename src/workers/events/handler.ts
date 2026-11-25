import './sentry';

import * as Sentry from '@sentry/node';
import type { SQSBatchResponse, SQSHandler } from 'aws-lambda';

import type { QueueProcessedKeys } from '@/shared/queue/utils';
import { sanitizeBodyForSentry } from '@/utils/sanitize-for-sentry';

import { env } from './env';
import { logger } from './logger';
import { resolveEventSource, UnknownEventSourceError } from './sources';
import type { SnsEnvelope } from './types';

const processedKeys: QueueProcessedKeys = new Map();

function parseSnsMessage(message: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(message);

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new SyntaxError('SNS message body is not a JSON object');
  }

  return parsed as Record<string, unknown>;
}

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const batchItemFailures: { itemIdentifier: string }[] = [];
  const seenIds = new Set<string>();

  for (const record of event.Records) {
    const receiveCount = Number(record.attributes.ApproximateReceiveCount);

    if (seenIds.has(record.messageId)) {
      continue;
    }
    seenIds.add(record.messageId);

    try {
      const body: unknown = JSON.parse(record.body);
      const sns = body as SnsEnvelope;
      const payload = parseSnsMessage(sns.Message);
      const source = resolveEventSource(sns, payload);

      await source.handle(payload, { sns, processedKeys });

      logger.info('Event processed', {
        messageId: record.messageId,
        snsMessageId: sns.MessageId,
        source: source.name,
      });
    } catch (err) {
      const isSyntaxError = err instanceof SyntaxError;
      const isTypeError = err instanceof TypeError;
      const isUnknownSource = err instanceof UnknownEventSourceError;
      const isPermanentError = isSyntaxError || isTypeError || isUnknownSource;

      logger.error('Event processing failed', {
        messageId: record.messageId,
        receiveCount,
        errorType: err instanceof Error ? err.name : typeof err,
        error: err instanceof Error ? err.message : String(err),
      });

      if (isPermanentError) {
        Sentry.captureException(err, {
          captureContext: {
            level: 'error',
            tags: { worker: 'events' },
            extra: {
              messageId: record.messageId,
              body: sanitizeBodyForSentry(record.body),
            },
          },
        });

        continue;
      }

      if (receiveCount >= env.SQS_EVENTS_MAX_RECEIVE_COUNT) {
        Sentry.captureException(err, {
          captureContext: {
            level: 'error',
            tags: { worker: 'events' },
            extra: { messageId: record.messageId, receiveCount },
          },
        });
      }

      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  await Sentry.flush(1000);

  return { batchItemFailures };
};
