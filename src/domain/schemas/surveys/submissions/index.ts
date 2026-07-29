import { z } from 'zod';

import {
  SURVEY_FILLING_METHODS,
  SURVEY_SUBMISSION_STATUSES,
} from '@/domain/enums/survey-submissions';

import { baseEntitySchema } from '../../base';
import { uuidSchema } from '../../shared';

export const surveySubmissionSchema = z.strictObject({
  ...baseEntitySchema.shape,
  status: z.enum(SURVEY_SUBMISSION_STATUSES).default('pending_document'),
  reason: z.string().max(500).nullable(),
  fillingMethod: z.enum(SURVEY_FILLING_METHODS),
  surveyToken: uuidSchema.nullable(),
  updatedBy: uuidSchema.nullable(),
});
export type SurveySubmissionSchema = z.infer<typeof surveySubmissionSchema>;
