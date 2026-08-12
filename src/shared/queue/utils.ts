import { v7 as uuidv7 } from 'uuid';

export type QueueProcessedKeys = Map<string, number>;

/**
 * Generates a unique idempotency key for queue messages.
 *
 * Uses UUID v7 to avoid collision with past or future enqueues.
 * Each call produces a new key — never derive keys from message content,
 * or legitimate resends will be incorrectly deduplicated.
 *
 * @returns A UUID v7 string to be used as `idempotencyKey` in the message envelope.
 */
export function generateQueueIdempotencyKey(): string {
  return uuidv7();
}

const DEFAULT_DEDUP_TTL_MS = 10 * 60 * 1000;

/**
 * Checks whether an `idempotencyKey` has already been processed within the
 * deduplication window.
 *
 * Expired entries are automatically removed from the map on lookup.
 *
 * @param idempotencyKey - The key to check.
 * @param processedKeys - A `Map<string, number>` tracking processed keys and their timestamps.
 * @param dedupTtlMs - Time-to-live in milliseconds (default: 10 minutes).
 * @returns `true` if the key was processed within the TTL, `false` otherwise.
 */
export function checkIsProcessed(
  idempotencyKey: string,
  processedKeys: QueueProcessedKeys,
  dedupTtlMs: number = DEFAULT_DEDUP_TTL_MS,
): boolean {
  const timestamp = processedKeys.get(idempotencyKey);
  if (!timestamp) return false;
  if (Date.now() - timestamp > dedupTtlMs) {
    processedKeys.delete(idempotencyKey);
    return false;
  }
  return true;
}

/**
 * Records an `idempotencyKey` as processed with the current timestamp.
 *
 * Call this after the message has been successfully handled.
 *
 * @param idempotencyKey - The key to mark as processed.
 * @param processedKeys - A `Map<string, number>` shared across the consumer lifecycle.
 */
export function markProcessed(
  idempotencyKey: string,
  processedKeys: QueueProcessedKeys,
): void {
  processedKeys.set(idempotencyKey, Date.now());
}
