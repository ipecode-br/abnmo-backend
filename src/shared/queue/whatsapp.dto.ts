import { z } from 'zod';

export const sendWhatsAppJobSchema = z.discriminatedUnion('template', [
  z.object({
    template: z.literal('completeSurvey'),
    to: z.string().min(1),
    name: z.string().min(1),
    token: z.string().min(1),
  }),
  z.object({
    template: z.literal('declineSurvey'),
    to: z.string().min(1),
    name: z.string().min(1),
    reason: z.string().min(1).max(500),
  }),
]);

export type SendWhatsAppJob = z.infer<typeof sendWhatsAppJobSchema>;

export function parseWhatsAppMessage(message: unknown): SendWhatsAppJob {
  return sendWhatsAppJobSchema.parse(message);
}
