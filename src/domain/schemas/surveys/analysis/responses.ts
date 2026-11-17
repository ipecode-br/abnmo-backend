import { z } from 'zod';

import { baseResponseSchema } from '../../base';
import { surveyAnalysisSchema } from '.';

export const surveyAnalysisListItemSchema = surveyAnalysisSchema.pick({
  id: true,
  questionKey: true,
  question: true,
  rawResponse: true,
  terms: true,
  promptVersion: true,
  model: true,
  updatedAt: true,
  createdAt: true,
});
export type SurveyAnalysisListItem = z.infer<
  typeof surveyAnalysisListItemSchema
>;

export const getSurveyAnalysesResponseSchema = baseResponseSchema.extend({
  data: z.strictObject({
    analyses: z.array(surveyAnalysisListItemSchema),
  }),
});
