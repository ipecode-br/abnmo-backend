import { z } from 'zod';

export const sendWhatsAppJobSchema = z.discriminatedUnion('template', [
  z.object({
    template: z.literal('completeSurvey'),
    to: z.string().min(1),
    name: z.string().min(1),
    token: z.string().min(1),
  }),
]);

export type SendWhatsAppJob = z.infer<typeof sendWhatsAppJobSchema>;

export function parseWhatsAppMessage(message: unknown): SendWhatsAppJob {
  return sendWhatsAppJobSchema.parse(message);
}
