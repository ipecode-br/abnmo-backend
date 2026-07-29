import { z } from 'zod';

import { MAX_SURVEY_DOCUMENT_FILE_SIZE } from '@/config/storage';
import {
  SURVEY_FILLING_METHODS,
  SURVEY_SUBMISSION_ORDER_BY,
  SURVEY_SUBMISSION_STATUSES,
} from '@/domain/enums/survey-submissions';
import { SURVEY_DOCUMENT_TYPES } from '@/domain/enums/surveys';
import {
  queryDateSchema,
  queryOrderSchema,
  queryPageSchema,
  queryPeriodSchema,
  queryPerPageSchema,
  querySearchSchema,
  validateEndDate,
} from '@/domain/schemas/query';

import { emailSchema, nameSchema, phoneSchema } from '../../shared';

export const createSurveySubmissionSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  mimeType: z.enum(SURVEY_DOCUMENT_TYPES),
  fileSize: z.number().min(1).max(MAX_SURVEY_DOCUMENT_FILE_SIZE),
  fillingMethod: z.enum(SURVEY_FILLING_METHODS),
});

export const declineSurveySubmissionSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const getSurveySubmissionsQuerySchema = z
  .object({
    search: querySearchSchema.optional(),
    status: z.enum(SURVEY_SUBMISSION_STATUSES).optional(),
    orderBy: z.enum(SURVEY_SUBMISSION_ORDER_BY).optional().default('date'),
    order: queryOrderSchema.default('ASC'),
    startDate: queryDateSchema.optional(),
    endDate: queryDateSchema.optional(),
    page: queryPageSchema,
    perPage: queryPerPageSchema,
  })
  .superRefine(validateEndDate);

export const getTotalSurveySubmissionsQuerySchema = z
  .object({
    status: z.enum(SURVEY_SUBMISSION_STATUSES).optional(),
    period: queryPeriodSchema.optional(),
    startDate: queryDateSchema.optional(),
    endDate: queryDateSchema.optional(),
  })
  .superRefine(validateEndDate);
