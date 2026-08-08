import { v7 as uuidv7 } from 'uuid';

type ProcessedKeys = Map<string, number>;

export function generateQueueIdempotencyKey(): string {
  return uuidv7();
}

const DEDUP_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function checkIsProcessed(
  idempotencyKey: string,
  processedKeys: ProcessedKeys,
  dedupTtlMs: number = DEDUP_TTL_MS,
): boolean {
  const timestamp = processedKeys.get(idempotencyKey);
  if (!timestamp) return false;
  if (Date.now() - timestamp > dedupTtlMs) {
    processedKeys.delete(idempotencyKey);
    return false;
  }
  return true;
}

export function markProcessed(
  idempotencyKey: string,
  processedKeys: ProcessedKeys,
): void {
  processedKeys.set(idempotencyKey, Date.now());
}
