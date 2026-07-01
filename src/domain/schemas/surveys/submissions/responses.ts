import { z } from 'zod';

import { baseResponseSchema } from '../../base';
import { emailSchema, nameSchema, phoneSchema } from '../../shared';
import { userSchema } from '../../users';
import { surveySubmissionSchema } from '.';

export const createSurveySubmissionResponseSchema = baseResponseSchema.extend({
  data: z.object({
    submissionId: surveySubmissionSchema.shape.id,
    key: z.string(),
    url: z.string().url(),
    fields: z.record(z.string(), z.string()),
  }),
});

export const surveySubmissionResponseSchema = surveySubmissionSchema
  .pick({ id: true, status: true, documentKey: true, createdAt: true })
  .extend({ name: nameSchema, email: emailSchema, phone: phoneSchema })
  .strict();
export type SurveySubmissionResponse = z.infer<
  typeof surveySubmissionResponseSchema
>;

export const getSurveySubmissionsResponseSchema = baseResponseSchema.extend({
  data: z
    .object({
      submissions: z.array(surveySubmissionResponseSchema),
      total: z.number(),
    })
    .strict(),
});

export const surveySubmissionDetailsResponseSchema = surveySubmissionSchema
  .pick({
    id: true,
    status: true,
    documentKey: true,
    updatedAt: true,
    createdAt: true,
  })
  .extend({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema.nullable(),
    updatedBy: userSchema
      .pick({ id: true, name: true, email: true, avatarUrl: true })
      .nullable(),
  })
  .strict();
export type SurveySubmissionDetailsResponse = z.infer<
  typeof surveySubmissionDetailsResponseSchema
>;

export const getSurveySubmissionResponseSchema = baseResponseSchema.extend({
  data: surveySubmissionDetailsResponseSchema,
});

export const getTotalSurveySubmissionsResponseSchema = baseResponseSchema
  .extend({ data: z.object({ total: z.number() }) })
  .strict();
