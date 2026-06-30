import { z } from 'zod';

import { SURVEY_STATUSES, SURVEYS_ORDER_BY } from '@/domain/enums/surveys';

import { baseQuerySchema } from '../../query';
import { supportContactSchema } from '../../shared';
import { aboutYouSurveySchema } from './about-you';
import { dailyLifeSurveySchema } from './daily-life';
import { diagnosisSurveySchema } from './diagnosis';
import { familySurveySchema } from './family';
import { followUpSurveySchema } from './follow-up';
import { journeySurveySchema } from './journey';

export const createSurveySchema = z.object({
  token: z.string().uuid(),
  aboutYou: aboutYouSurveySchema,
  family: familySurveySchema,
  journey: journeySurveySchema,
  diagnosis: diagnosisSurveySchema,
  followUp: followUpSurveySchema,
  dailyLife: dailyLifeSurveySchema,
  supportContacts: z.array(supportContactSchema).min(1),
});

export const getSurveysQuerySchema = baseQuerySchema
  .pick({
    order: true,
    period: true,
    startDate: true,
    endDate: true,
    page: true,
    perPage: true,
  })
  .extend({
    status: z.enum(SURVEY_STATUSES).optional(),
    orderBy: z.enum(SURVEYS_ORDER_BY).optional().default('date'),
  });
