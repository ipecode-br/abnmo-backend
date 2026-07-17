import { z } from 'zod';

import { SURVEY_STATUSES, SURVEYS_ORDER_BY } from '@/domain/enums/surveys';

import {
  queryDateSchema,
  queryOrderSchema,
  queryPageSchema,
  queryPeriodSchema,
  queryPerPageSchema,
  querySearchSchema,
  validateEndDate,
} from '../../query';
import { supportContactSchema } from '../../shared';
import { aboutYouSurveySchema } from './about-you';
import { dailyLifeSurveySchema } from './daily-life';
import { diagnosisSurveySchema } from './diagnosis';
import { familySurveySchema } from './family';
import { followUpSurveySchema } from './follow-up';
import { journeySurveySchema } from './journey';

export const createSurveySchema = z.object({
  token: z.uuid(),
  aboutYou: aboutYouSurveySchema,
  family: familySurveySchema,
  journey: journeySurveySchema,
  diagnosis: diagnosisSurveySchema,
  followUp: followUpSurveySchema,
  dailyLife: dailyLifeSurveySchema,
  supportContacts: z.array(supportContactSchema).min(1),
});

export const getSurveysQuerySchema = z
  .object({
    search: querySearchSchema.optional(),
    status: z.enum(SURVEY_STATUSES).optional(),
    order: queryOrderSchema.default('DESC'),
    orderBy: z.enum(SURVEYS_ORDER_BY).optional().default('date'),
    period: queryPeriodSchema.optional(),
    startDate: queryDateSchema.optional(),
    endDate: queryDateSchema.optional(),
    page: queryPageSchema,
    perPage: queryPerPageSchema,
  })
  .superRefine(validateEndDate);
