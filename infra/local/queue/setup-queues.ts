import { createSqsClient, ensureQueues, getQueueUrls } from './sqs-client';

const QUEUE_URL_ENV_NAMES = ['EMAIL_QUEUE_URL', 'WHATSAPP_QUEUE_URL'];

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 1500;

async function setup() {
  const queues = QUEUE_URL_ENV_NAMES.map((envName) => {
    const queueUrl = process.env[envName];

    if (!queueUrl) {
      throw new Error(`${envName} environment variable is required`);
    }

    return getQueueUrls(queueUrl);
  });

  const sqs = createSqsClient(queues[0].url);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await ensureQueues(sqs, queues);
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
