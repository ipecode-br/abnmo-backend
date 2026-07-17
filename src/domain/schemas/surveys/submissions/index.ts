import { z } from 'zod';

import { SURVEY_SUBMISSION_STATUSES } from '@/domain/enums/survey-submissions';

import { baseEntitySchema } from '../../base';

export const surveySubmissionSchema = z.strictObject({
  ...baseEntitySchema.shape,
  status: z.enum(SURVEY_SUBMISSION_STATUSES).default('pending_document'),
  reason: z.string().max(500).nullable(),
  surveyToken: z.uuid().nullable(),
  updatedBy: z.uuid().nullable(),
});
export type SurveySubmissionSchema = z.infer<typeof surveySubmissionSchema>;
