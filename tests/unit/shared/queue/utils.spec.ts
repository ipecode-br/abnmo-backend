import {
  checkIsProcessed,
  generateQueueIdempotencyKey,
  markProcessed,
} from '@/shared/queue/utils';

describe('generateQueueIdempotencyKey()', () => {
  it('returns a UUID string', () => {
    const key = generateQueueIdempotencyKey();
    expect(key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('returns different keys on each call', () => {
    const keys = new Set(
      Array.from({ length: 100 }, () => generateQueueIdempotencyKey()),
    );
    expect(keys.size).toBe(100);
  });
});

describe('checkIsProcessed() and markProcessed()', () => {
  let processedKeys: Map<string, number>;

  beforeEach(() => {
    processedKeys = new Map();
  });

  it('returns false for an unknown key', () => {
    expect(checkIsProcessed('unknown', processedKeys)).toBe(false);
  });

  it('returns true after markProcessed is called', () => {
    markProcessed('key-1', processedKeys);
    expect(checkIsProcessed('key-1', processedKeys)).toBe(true);
  });

  it('returns false for a different key', () => {
    markProcessed('key-1', processedKeys);
    expect(checkIsProcessed('key-2', processedKeys)).toBe(false);
  });

  it('returns false and removes entry after TTL expires', () => {
    markProcessed('key-1', processedKeys);

    const pastTimestamp = Date.now() - 1000;
    processedKeys.set('key-1', pastTimestamp);

    expect(checkIsProcessed('key-1', processedKeys, 500)).toBe(false);
    expect(processedKeys.has('key-1')).toBe(false);
  });

  it('returns true if within the configured TTL', () => {
    markProcessed('key-1', processedKeys);
    expect(checkIsProcessed('key-1', processedKeys, 60000)).toBe(true);
  });
});
