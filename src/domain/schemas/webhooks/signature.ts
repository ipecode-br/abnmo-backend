import { z } from 'zod';

export const surveySignatureWebhookSchema = z.object({
  event: z.object({ name: z.string() }),
  document: z.object({
    key: z.string(),
    status: z.string(),
    metadata: z.object({ key: z.string() }).optional(),
  }),
});

export type SurveySignatureWebhook = z.infer<
  typeof surveySignatureWebhookSchema
>;
