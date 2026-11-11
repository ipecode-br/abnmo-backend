import { z } from 'zod';

import {
  SURVEY_ANALYSIS_MODELS,
  SURVEY_ANALYSIS_QUESTION_KEYS,
} from '@/domain/enums/survey-analysis';

import { uuidSchema } from '../../shared';
import { surveyAnalysisTermSchema } from '.';

export const patientIdParamSchema = z.strictObject({
  patientId: uuidSchema,
});

export const updateSurveyAnalysisTermsSchema = z.strictObject({
  terms: z.array(surveyAnalysisTermSchema).max(15),
});

export const reanalyzeSurveyAnswerSchema = z.strictObject({
  patientId: uuidSchema,
  questionKey: z.enum(SURVEY_ANALYSIS_QUESTION_KEYS),
  model: z.enum(SURVEY_ANALYSIS_MODELS).default('gpt-5'),
});
