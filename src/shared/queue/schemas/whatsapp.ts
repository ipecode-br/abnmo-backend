import { z } from 'zod';

const phoneSchema = z.string().startsWith('+55');

const sendWhatsAppJobSchema = z.discriminatedUnion('template', [
  z.object({
    template: z.literal('completeSurvey'),
    to: phoneSchema,
    name: z.string().min(1),
    token: z.string().min(1),
  }),
  z.object({
    template: z.literal('declineSurvey'),
    to: phoneSchema,
    name: z.string().min(1),
    reason: z.string().min(1).max(500),
  }),
]);

export type SendWhatsAppJob = z.infer<typeof sendWhatsAppJobSchema>;

export function parseWhatsAppMessage(message: unknown): SendWhatsAppJob {
  return sendWhatsAppJobSchema.parse(message);
}
