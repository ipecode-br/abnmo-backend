import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { userSchema } from '../users';
import { surveySchema } from '.';

export const listSurveyResponseSchema = surveySchema
  .pick({ id: true, status: true, createdAt: true })
  .merge(userSchema.pick({ name: true, phone: true, email: true }))
  .strict();
export type ListSurveyResponse = z.infer<typeof listSurveyResponseSchema>;

export const getSurveysResponseSchema = baseResponseSchema.extend({
  data: z
    .object({
      surveys: z.array(listSurveyResponseSchema),
      total: z.number(),
    })
    .strict(),
});
