import { z } from 'zod';

import { baseResponseSchema } from '../../base';
import { documentSchema } from '../../documents';
import { emailSchema, nameSchema, phoneSchema } from '../../shared';
import { surveySubmissionSchema } from '.';

export const createSurveySubmissionResponseSchema = baseResponseSchema
  .extend({
    data: z.object({
      submissionId: surveySubmissionSchema.shape.id,
      url: z.url(),
      fields: z.record(z.string(), z.string()),
    }),
  })
  .strict();

export const surveySubmissionResponseSchema = z.strictObject({
  ...surveySubmissionSchema.pick({
    id: true,
    status: true,
    reason: true,
    fillingMethod: true,
    createdAt: true,
  }).shape,
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  document: documentSchema.pick({ name: true, url: true }).nullable(),
});
export type SurveySubmissionResponse = z.infer<
  typeof surveySubmissionResponseSchema
>;

export const getSurveySubmissionsResponseSchema = baseResponseSchema.extend({
  data: z.strictObject({
    submissions: z.array(surveySubmissionResponseSchema),
    total: z.number(),
  }),
});

export const surveySubmissionDetailsResponseSchema = z.strictObject({
  ...surveySubmissionSchema.pick({
    id: true,
    status: true,
    reason: true,
    fillingMethod: true,
    updatedAt: true,
    createdAt: true,
  }).shape,
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  document: documentSchema
    .pick({
      key: true,
      url: true,
      name: true,
      filename: true,
      size: true,
      mimeType: true,
    })
    .nullable(),
});
export type SurveySubmissionDetailsResponse = z.infer<
  typeof surveySubmissionDetailsResponseSchema
>;

export const getSurveySubmissionResponseSchema = baseResponseSchema.extend({
  data: surveySubmissionDetailsResponseSchema,
});

export const getTotalSurveySubmissionsResponseSchema = z.strictObject({
  ...baseResponseSchema.shape,
  data: z.strictObject({ total: z.number() }),
});
