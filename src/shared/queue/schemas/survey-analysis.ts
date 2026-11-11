import { z } from 'zod';

import {
  SURVEY_ANALYSIS_MODELS,
  SURVEY_ANALYSIS_QUESTION_KEYS,
} from '@/domain/enums/survey-analysis';
import { uuidSchema } from '@/domain/schemas/shared';

const analyzeSurveyAnswerJobSchema = z.object({
  patientId: uuidSchema,
  questionKey: z.enum(SURVEY_ANALYSIS_QUESTION_KEYS),
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  model: z.enum(SURVEY_ANALYSIS_MODELS),
});

export type AnalyzeSurveyAnswerJob = z.infer<
  typeof analyzeSurveyAnswerJobSchema
>;

export function parseSurveyAnalysisMessage(
  message: unknown,
): AnalyzeSurveyAnswerJob {
  return analyzeSurveyAnswerJobSchema.parse(message);
}
