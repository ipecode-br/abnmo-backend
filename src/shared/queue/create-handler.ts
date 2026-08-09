import * as Sentry from '@sentry/node';
import type { SQSBatchResponse, SQSHandler } from 'aws-lambda';
import { z } from 'zod';

import { messageEnvelopeSchema } from './envelope';
import { QueueWorkerLogger } from './logger';
import {
  checkIsProcessed,
  markProcessed,
  type QueueProcessedKeys,
} from './utils';

export interface QueueWorkerConfig {
  name: string;
  maxReceiveCount: number;
  parsePayload: (payload: unknown) => unknown;
  dedupTtlMs?: number;
}

export interface QueueWorkerCallbacks {
  onProcess: (job: unknown, messageId: string) => Promise<void>;
  logger: QueueWorkerLogger;
}

export function createQueueWorkerHandler(
  { maxReceiveCount, name, parsePayload, dedupTtlMs }: QueueWorkerConfig,
  { onProcess, logger }: QueueWorkerCallbacks,
): SQSHandler {
  const processedKeys: QueueProcessedKeys = new Map();

  return async (event): Promise<SQSBatchResponse> => {
    const batchItemFailures: { itemIdentifier: string }[] = [];
    const seenIds = new Set<string>();

    for (const record of event.Records) {
      if (seenIds.has(record.messageId)) continue;
      seenIds.add(record.messageId);

      try {
        const body: unknown = JSON.parse(record.body);
        const envelope = messageEnvelopeSchema.parse(body);

        if (
          checkIsProcessed(envelope.idempotencyKey, processedKeys, dedupTtlMs)
        ) {
          logger.info('Duplicate message skipped', {
            messageId: record.messageId,
            idempotencyKey: envelope.idempotencyKey,
          });
          continue;
        }

        const job = parsePayload(envelope.payload);
        await onProcess(job, record.messageId);

        markProcessed(envelope.idempotencyKey, processedKeys);

        logger.info('Message processed', { messageId: record.messageId });
      } catch (err) {
        const receiveCount = Number(record.attributes.ApproximateReceiveCount);

        logger.error('Message processing failed', {
          messageId: record.messageId,
          receiveCount,
          error: err instanceof Error ? err.message : String(err),
        });

        if (
          err instanceof z.ZodError ||
          err instanceof SyntaxError ||
          receiveCount === maxReceiveCount
        ) {
          Sentry.captureException(err, {
            captureContext: {
              level: 'error',
              tags: { worker: name },
              extra: { messageId: record.messageId, receiveCount },
            },
          });
        }

        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }

    return { batchItemFailures };
  };
}
