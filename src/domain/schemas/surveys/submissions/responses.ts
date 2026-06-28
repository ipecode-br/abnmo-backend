import { z } from 'zod';

import { baseResponseSchema } from '../../base';
import { userSchema } from '../../users';
import { surveySubmissionSchema } from '.';

export const surveySubmissionResponseSchema = surveySubmissionSchema
  .pick({
    id: true,
    name: true,
    email: true,
    phone: true,
    status: true,
    createdAt: true,
  })
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
    name: true,
    email: true,
    phone: true,
    status: true,
    updatedAt: true,
    createdAt: true,
  })
  .extend({
    approvedBy: userSchema
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
