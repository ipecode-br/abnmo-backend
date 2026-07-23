import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { userSchema } from '../users';
import { surveySchema } from '.';

export const listSurveyResponseSchema = z.strictObject({
  ...surveySchema.pick({ id: true, status: true, createdAt: true }).shape,
  ...userSchema.pick({ name: true, phone: true, email: true }).shape,
});
export type ListSurveyResponse = z.infer<typeof listSurveyResponseSchema>;

export const getSurveysResponseSchema = baseResponseSchema.extend({
  data: z.strictObject({
    surveys: z.array(listSurveyResponseSchema),
    total: z.number(),
  }),
});

export const surveyDetailsResponseSchema = z.strictObject({
  ...surveySchema.shape,
  patient: userSchema.pick({
    id: true,
    name: true,
    phone: true,
    email: true,
    cpf: true,
    susId: true,
  }),
});
export type SurveyDetailsResponse = z.infer<typeof surveyDetailsResponseSchema>;

export const getSurveyResponseSchema = baseResponseSchema.extend({
  data: surveyDetailsResponseSchema,
});
