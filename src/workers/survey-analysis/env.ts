import 'dotenv/config';

import { z } from 'zod';

export const surveyAnalysisWorkerEnvSchema = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']).optional(),

  SQS_SURVEY_ANALYSIS_MAX_RECEIVE_COUNT: z.coerce.number().default(5),
  OPENAI_API_KEY: z.string().min(1),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number(),
  DB_DATABASE: z.string().min(1),
  DB_USERNAME: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_SCHEMA: z.string().optional(),

  SENTRY_DSN: z.string().optional().default(''),
  SENTRY_LOGS: z.enum(['all', 'error', 'none']).default('none'),
});

export type SurveyAnalysisWorkerEnv = z.infer<
  typeof surveyAnalysisWorkerEnvSchema
>;

export const env = surveyAnalysisWorkerEnvSchema.parse(process.env);
