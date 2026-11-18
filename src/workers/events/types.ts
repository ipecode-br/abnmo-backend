import type { z } from 'zod';

import type { QueueProcessedKeys } from '@/shared/queue/utils';

import type { snsEnvelopeSchema } from './schemas';

export type SnsEnvelope = z.infer<typeof snsEnvelopeSchema>;

export interface EventContext {
  sns: SnsEnvelope;
  messageId: string;
  processedKeys: QueueProcessedKeys;
}
