import { z } from 'zod';

export const messageEnvelopeSchema = z.object({
  version: z.literal(1),
  type: z.enum(['email', 'whatsapp']),
  payload: z.unknown(),
  idempotencyKey: z.uuid(),
});

export type MessageEnvelope<T> = z.infer<typeof messageEnvelopeSchema> & {
  payload: T;
};
