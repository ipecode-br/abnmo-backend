import { z } from 'zod';

import { MAX_SURVEY_DOCUMENT_FILE_SIZE } from '@/config/storage';
import {
  SURVEY_SUBMISSION_ORDER_BY,
  SURVEY_SUBMISSION_STATUSES,
} from '@/domain/enums/survey-submissions';
import { SURVEY_DOCUMENT_TYPES } from '@/domain/enums/surveys';
import { baseQuerySchema } from '@/domain/schemas/query';

import { emailSchema, nameSchema, phoneSchema } from '../../shared';

export const createSurveySubmissionSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  mimeType: z.enum(SURVEY_DOCUMENT_TYPES),
  fileSize: z.number().min(1).max(MAX_SURVEY_DOCUMENT_FILE_SIZE),
});

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
