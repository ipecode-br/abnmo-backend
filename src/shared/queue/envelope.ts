import { z } from 'zod';

export const messageEnvelopeSchema = z.object({
  version: z.literal(1),
  type: z.literal('email'),
  payload: z.unknown(),
});

export type MessageEnvelope<T> = z.infer<typeof messageEnvelopeSchema> & {
  payload: T;
};
