import * as Sentry from '@sentry/node';
import type { SQSBatchResponse, SQSHandler } from 'aws-lambda';
import { z } from 'zod';

import { debugLog, describeError } from '@/utils/debug-log';

import { messageEnvelopeSchema } from './envelope';
import { QueueWorkerLogger } from './logger';
import {
  checkIsProcessed,
  markProcessed,
  type QueueProcessedKeys,
} from './utils';

type ErrorConstructor = abstract new (...args: never[]) => Error;

export interface QueueWorkerConfig {
  name: string;
  maxReceiveCount: number;
  parsePayload: (payload: unknown) => unknown;
  dedupTtlMs?: number;
  permanentErrors?: ErrorConstructor | ErrorConstructor[];
}

export interface QueueWorkerCallbacks {
  onProcess: (job: unknown, messageId: string) => Promise<void>;
  logger: QueueWorkerLogger;
}

export function createQueueWorkerHandler(
  {
    maxReceiveCount,
    name,
    parsePayload,
    dedupTtlMs,
    permanentErrors,
  }: QueueWorkerConfig,
  { onProcess, logger }: QueueWorkerCallbacks,
): SQSHandler {
  const processedKeys: QueueProcessedKeys = new Map();

  let permanentErrorClasses: ErrorConstructor[] = [];

  if (permanentErrors) {
    permanentErrorClasses = Array.isArray(permanentErrors)
      ? permanentErrors
      : [permanentErrors];
  }

  return async (event): Promise<SQSBatchResponse> => {
    const batchItemFailures: { itemIdentifier: string }[] = [];
    const seenIds = new Set<string>();

    debugLog('handler invoked', {
      worker: name,
      recordCount: event.Records.length,
      maxReceiveCount,
      permanentErrors: permanentErrorClasses.map(
        (ErrorClass) => ErrorClass.name,
      ),
    });

    for (const record of event.Records) {
      const receiveCount = Number(record.attributes.ApproximateReceiveCount);

      debugLog('record received', {
        worker: name,
        messageId: record.messageId,
        receiveCount,
        bodyLength: record.body.length,
        body: record.body,
      });

      if (seenIds.has(record.messageId)) {
        debugLog('duplicate messageId skipped', {
          messageId: record.messageId,
        });
        continue;
      }
      seenIds.add(record.messageId);

      try {
        const body: unknown = JSON.parse(record.body);

        debugLog('message body parsed', { messageId: record.messageId });

        const envelope = messageEnvelopeSchema.parse(body);

        debugLog('envelope parsed', {
          messageId: record.messageId,
          type: envelope.type,
          idempotencyKey: envelope.idempotencyKey,
        });

        if (
          checkIsProcessed(envelope.idempotencyKey, processedKeys, dedupTtlMs)
        ) {
          debugLog('duplicate idempotencyKey skipped', {
            messageId: record.messageId,
            idempotencyKey: envelope.idempotencyKey,
          });

          logger.info('Duplicate message skipped', {
            messageId: record.messageId,
            idempotencyKey: envelope.idempotencyKey,
          });
          continue;
        }

        const job = parsePayload(envelope.payload);

        debugLog('payload parsed', {
          messageId: record.messageId,
          payload: job,
        });

        debugLog('processing started', { messageId: record.messageId });

        await onProcess(job, record.messageId);

        debugLog('processing finished', { messageId: record.messageId });

        markProcessed(envelope.idempotencyKey, processedKeys);

        logger.info('Message processed', { messageId: record.messageId });
      } catch (err) {
        const isZodError = err instanceof z.ZodError;
        const isSyntaxError = err instanceof SyntaxError;
        const isTypeError = err instanceof TypeError;
        const matchedPermanentErrors = permanentErrorClasses
          .filter((ErrorClass) => err instanceof ErrorClass)
          .map((ErrorClass) => ErrorClass.name);
        const isPermanentError =
          isZodError ||
          isSyntaxError ||
          isTypeError ||
          matchedPermanentErrors.length > 0;

        debugLog('processing failed', {
          worker: name,
          messageId: record.messageId,
          receiveCount,
          isZodError,
          isSyntaxError,
          isTypeError,
          matchedPermanentErrors,
          isPermanentError,
          ...describeError(err),
        });

        logger.error('Message processing failed', {
          messageId: record.messageId,
          receiveCount,
          errorType: err instanceof Error ? err.name : typeof err,
          error: err instanceof Error ? err.message : String(err),
        });

        if (isPermanentError) {
          Sentry.captureException(err, {
            captureContext: {
              level: 'error',
              tags: { worker: name },
              extra: { messageId: record.messageId, body: record.body },
            },
          });

          debugLog('record resolved', {
            messageId: record.messageId,
            action: 'dropped',
            reason: 'permanent-error',
          });
          continue;
        }

        if (receiveCount >= maxReceiveCount) {
          Sentry.captureException(err, {
            captureContext: {
              level: 'error',
              tags: { worker: name },
              extra: { messageId: record.messageId, receiveCount },
            },
          });

          debugLog('record resolved', {
            messageId: record.messageId,
            action: 'retry',
            reason: 'max-receive-count-reached',
          });
          batchItemFailures.push({ itemIdentifier: record.messageId });
          continue;
        }

        debugLog('record resolved', {
          messageId: record.messageId,
          action: 'retry',
          reason: 'transient-error',
        });
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }

    const flushSucceeded = await Sentry.flush(1000);

    debugLog('sentry flush', { worker: name, flushSucceeded });

    debugLog('handler finished', {
      worker: name,
      batchItemFailures,
    });

    return { batchItemFailures };
  };
}
