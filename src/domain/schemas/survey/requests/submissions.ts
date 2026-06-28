import { z } from 'zod';

import {
  SURVEY_SUBMISSION_ORDER_BY,
  SURVEY_SUBMISSION_STATUSES,
} from '@/domain/enums/survey';
import { baseQuerySchema } from '@/domain/schemas/query';

export const getSurveySubmissionsQuerySchema = baseQuerySchema
  .pick({
    search: true,
    order: true,
    startDate: true,
    endDate: true,
    page: true,
    perPage: true,
  })
  .extend({
    status: z.enum(SURVEY_SUBMISSION_STATUSES).optional(),
    orderBy: z.enum(SURVEY_SUBMISSION_ORDER_BY).optional(),
  });

export const getTotalSurveySubmissionsQuerySchema = baseQuerySchema
  .pick({ period: true, startDate: true, endDate: true })
  .extend({ status: z.enum(SURVEY_SUBMISSION_STATUSES).optional() });
