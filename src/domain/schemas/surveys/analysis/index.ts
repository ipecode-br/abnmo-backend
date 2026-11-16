import { z } from 'zod';

import {
  SURVEY_ANALYSIS_QUESTION_KEYS,
  SURVEY_ANALYSIS_SENTIMENTS,
} from '@/domain/enums/survey-analysis';

import { baseEntitySchema } from '../../base';

export const surveyAnalysisTermSchema = z.strictObject({
  word: z.string().min(1),
  frequency: z.number().int().min(1),
  sentiment: z.enum(SURVEY_ANALYSIS_SENTIMENTS),
  weight: z.number().min(0).max(1),
});
export type SurveyAnalysisTerm = z.infer<typeof surveyAnalysisTermSchema>;

export const surveyAnalysisTermsSchema = z
  .array(surveyAnalysisTermSchema)
  .max(15);

export const surveyAnalysisSchema = z.strictObject({
  ...baseEntitySchema.shape,
  questionKey: z.enum(SURVEY_ANALYSIS_QUESTION_KEYS),
  question: z.string().min(1).max(500),
  rawResponse: z.string().min(1),
  terms: surveyAnalysisTermsSchema,
  promptVersion: z.string().min(1).max(16),
  model: z.string().min(1).max(32),
});
export type SurveyAnalysisSchema = z.infer<typeof surveyAnalysisSchema>;
