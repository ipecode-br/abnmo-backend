import { z } from 'zod';

import { SURVEY_SUBMISSION_STATUSES } from '@/domain/enums/survey-submissions';

import { baseEntitySchema } from '../../base';

export const surveySubmissionSchema = baseEntitySchema
  .extend({
    status: z.enum(SURVEY_SUBMISSION_STATUSES).default('pending_document'),
  })
  .strict();
export type SurveySubmissionSchema = z.infer<typeof surveySubmissionSchema>;
