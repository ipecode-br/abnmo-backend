import './sentry';

import * as Sentry from '@sentry/node';
import type { SQSBatchResponse, SQSHandler } from 'aws-lambda';
import { z } from 'zod';

import type { QueueProcessedKeys } from '@/shared/queue/utils';

import { env } from './env';
import { logger } from './logger';
import { snsEnvelopeSchema } from './schemas';
import { resolveEventSource, UnknownEventSourceError } from './sources';

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
      const sns = snsEnvelopeSchema.parse(body);
      const payload = parseSnsMessage(sns.Message);
      const source = resolveEventSource(sns, payload);

      await source.handle(payload, {
        sns,
        messageId: record.messageId,
        processedKeys,
      });

      logger.info('Event processed', {
        messageId: record.messageId,
        snsMessageId: sns.MessageId,
        source: source.name,
      });
    } catch (err) {
      const isZodError = err instanceof z.ZodError;
      const isSyntaxError = err instanceof SyntaxError;
      const isUnknownSource = err instanceof UnknownEventSourceError;
      const isPermanentError = isZodError || isSyntaxError || isUnknownSource;

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
            extra: { messageId: record.messageId, body: record.body },
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
