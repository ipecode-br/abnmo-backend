import { createSqsClient, ensureQueues } from './sqs-client';

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 1500;

async function setup() {
  const sqs = createSqsClient();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await ensureQueues(sqs);
      process.exit(0);
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        console.warn(
          `Queue setup failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS / 1000}s...`,
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        console.error('Queue setup failed after all retries:', err);
        process.exit(1);
      }
    }
  }
}

void setup();
