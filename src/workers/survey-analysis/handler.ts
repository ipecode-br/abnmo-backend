import './sentry';

import { AuthenticationError, PermissionDeniedError } from 'openai';

import { createQueueWorkerHandler } from '@/shared/queue/create-handler';
import {
  AnalyzeSurveyAnswerJob,
  parseSurveyAnalysisMessage,
} from '@/shared/queue/schemas/survey-analysis';

import {
  analyzeSurveyAnswer,
  InvalidAnalysisResponseError,
} from './analyze-survey-answer';
import { getDataSource } from './data-source';
import { env } from './env';
import { logger } from './logger';

export const handler = createQueueWorkerHandler(
  {
    name: 'survey-analysis',
    maxReceiveCount: env.SQS_SURVEY_ANALYSIS_MAX_RECEIVE_COUNT,
    parsePayload: parseSurveyAnalysisMessage,
    permanentErrors: [
      InvalidAnalysisResponseError,
      AuthenticationError,
      PermissionDeniedError,
    ],
  },
  {
    onProcess: async (job: AnalyzeSurveyAnswerJob) => {
      const dataSource = await getDataSource();
      await analyzeSurveyAnswer(job, dataSource);
    },
    logger,
  },
);
