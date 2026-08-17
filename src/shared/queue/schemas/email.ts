import { z } from 'zod';

const sendEmailJobSchema = z.discriminatedUnion('template', [
  z.object({
    template: z.literal('recoverPassword'),
    to: z.email(),
    name: z.string().min(1),
    resetPasswordUrl: z.url(),
  }),
  z.object({
    template: z.literal('resetPassword'),
    to: z.email(),
    name: z.string().min(1),
  }),
  z.object({
    template: z.literal('registerUser'),
    to: z.email(),
    registerUserUrl: z.url(),
  }),
  z.object({
    template: z.literal('completeSurvey'),
    to: z.email(),
    name: z.string().min(1),
    completeSurveyUrl: z.url(),
  }),
  z.object({
    template: z.literal('declineSurvey'),
    to: z.email(),
    name: z.string().min(1),
    reason: z.string().min(1).max(500),
  }),
]);

export type SendEmailJob = z.infer<typeof sendEmailJobSchema>;

export function parseEmailMessage(message: unknown): SendEmailJob {
  return sendEmailJobSchema.parse(message);
}
