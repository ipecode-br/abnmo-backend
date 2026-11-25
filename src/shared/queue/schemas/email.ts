import { z } from 'zod';

import { uuidSchema } from '@/domain/schemas/shared';

const sendEmailJobSchema = z.discriminatedUnion('template', [
  z.object({
    template: z.literal('recoverPassword'),
    to: z.email(),
    name: z.string().min(1),
    resetPasswordUrl: z.url(),
    userId: uuidSchema,
  }),
  z.object({
    template: z.literal('resetPassword'),
    to: z.email(),
    name: z.string().min(1),
    userId: uuidSchema.optional(),
  }),
  z.object({
    template: z.literal('registerUser'),
    to: z.email(),
    registerUserUrl: z.url(),
    userId: uuidSchema.optional(),
    inviteId: uuidSchema.optional(),
  }),
  z.object({
    template: z.literal('completeSurvey'),
    to: z.email(),
    name: z.string().min(1),
    completeSurveyUrl: z.url(),
    userId: uuidSchema.optional(),
  }),
  z.object({
    template: z.literal('declineSurvey'),
    to: z.email(),
    name: z.string().min(1),
    reason: z.string().min(1).max(500),
    userId: uuidSchema.optional(),
  }),
]);

export type SendEmailJob = z.infer<typeof sendEmailJobSchema>;

export function parseEmailMessage(message: unknown): SendEmailJob {
  return sendEmailJobSchema.parse(message);
}
