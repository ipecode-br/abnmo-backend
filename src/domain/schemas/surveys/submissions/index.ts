import { z } from 'zod';

import { SURVEY_SUBMISSION_STATUSES } from '@/domain/enums/survey-submissions';

import { baseEntitySchema } from '../../base';
import { emailSchema, nameSchema, phoneSchema } from '../../shared';

export const surveySubmissionSchema = baseEntitySchema
  .extend({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    status: z.enum(SURVEY_SUBMISSION_STATUSES).default('pending'),
    approvedById: z.string().uuid().nullable(),
  })
  .strict();
export type SurveySubmissionSchema = z.infer<typeof surveySubmissionSchema>;
