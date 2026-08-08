import * as Sentry from '@sentry/node';
import type { SQSBatchResponse, SQSHandler } from 'aws-lambda';
import { z } from 'zod';

import { flattenForSentry } from '@/utils/flatten-for-sentry';

import { messageEnvelopeSchema } from './envelope';
import {
  checkIsProcessed,
  markProcessed,
  type QueueProcessedKeys,
} from './utils';

export interface QueueWorkerConfig {
  name: string;
  maxReceiveCount: number;
  sentryLogs: 'all' | 'error' | 'none';
  parsePayload: (payload: unknown) => unknown;
  dedupTtlMs?: number;
}

export interface QueueWorkerLogger {
  info: (message: string, extras?: Record<string, unknown>) => void;
  error: (message: string, extras?: Record<string, unknown>) => void;
}

export interface QueueWorkerCallbacks {
  onProcess: (
    logger: QueueWorkerLogger,
    job: unknown,
    messageId: string,
  ) => Promise<void>;
}

function createLogger(name: string, sentryLogs: string) {
  const component = `${name}-worker`;

  function info(message: string, extras?: Record<string, unknown>): void {
    console.info(`[${new Date().toISOString()}] ${message}`, extras ?? '');

    if (sentryLogs === 'all') {
      Sentry.logger.info(
        `[${component}] ${message}`,
        flattenForSentry(extras ?? {}),
      );
    }
  }

  function error(message: string, extras?: Record<string, unknown>): void {
    console.error(`[${new Date().toISOString()}] ${message}`, extras ?? '');

    if (sentryLogs === 'all' || sentryLogs === 'error') {
      Sentry.logger.error(
        `[${component}] ${message}`,
        flattenForSentry(extras ?? {}),
      );
    }
  }

  return { info, error };
}

export function createQueueWorkerHandler(
  config: QueueWorkerConfig,
  { onProcess }: QueueWorkerCallbacks,
): SQSHandler {
  const logger = createLogger(config.name, config.sentryLogs);
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
          checkIsProcessed(
            envelope.idempotencyKey,
            processedKeys,
            config.dedupTtlMs,
          )
        ) {
          logger.info('Duplicate message skipped', {
            messageId: record.messageId,
            idempotencyKey: envelope.idempotencyKey,
          });
          continue;
        }

        const job = config.parsePayload(envelope.payload);
        await onProcess(logger, job, record.messageId);

        markProcessed(envelope.idempotencyKey, processedKeys);

        logger.info(`${config.name} processed`, {
          messageId: record.messageId,
        });
      } catch (err) {
        const receiveCount = Number(record.attributes.ApproximateReceiveCount);

        logger.error(`${config.name} processing failed`, {
          messageId: record.messageId,
          receiveCount,
          error: err instanceof Error ? err.message : String(err),
        });

        if (
          err instanceof z.ZodError ||
          err instanceof SyntaxError ||
          receiveCount === config.maxReceiveCount
        ) {
          Sentry.captureException(err, {
            captureContext: {
              level: 'error',
              tags: { worker: config.name },
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
