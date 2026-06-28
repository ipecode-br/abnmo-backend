import { createZodDto } from 'nestjs-zod';

import {
  completeSurveySchema,
  initSurveySchema,
} from '@/domain/schemas/surveys/requests';
import {
  getSurveySubmissionsQuerySchema,
  getTotalSurveySubmissionsQuerySchema,
} from '@/domain/schemas/surveys/requests/submissions';
import {
  getSurveySubmissionResponseSchema,
  getSurveySubmissionsResponseSchema,
  getTotalSurveySubmissionsResponseSchema,
} from '@/domain/schemas/surveys/responses';

export class InitSurveyBody extends createZodDto(initSurveySchema) {}

export class CompleteSurveyBody extends createZodDto(completeSurveySchema) {}

export class GetSurveySubmissionsQuery extends createZodDto(
  getSurveySubmissionsQuerySchema,
) {}
export class GetSurveySubmissionsResponse extends createZodDto(
  getSurveySubmissionsResponseSchema,
) {}

export class GetSurveySubmissionResponse extends createZodDto(
  getSurveySubmissionResponseSchema,
) {}

export class GetTotalSurveySubmissionsQuery extends createZodDto(
  getTotalSurveySubmissionsQuerySchema,
) {}
export class GetTotalSurveySubmissionsResponse extends createZodDto(
  getTotalSurveySubmissionsResponseSchema,
) {}
