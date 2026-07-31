import { createZodDto } from 'nestjs-zod';

import {
  createSurveySubmissionSchema,
  declineSurveySubmissionSchema,
  getSurveySubmissionsQuerySchema,
  getTotalSurveySubmissionsQuerySchema,
} from '@/domain/schemas/surveys/submissions/requests';
import {
  createSurveySubmissionResponseSchema,
  getSurveySubmissionResponseSchema,
  getSurveySubmissionsResponseSchema,
  getSurveyUrlResponseSchema,
  getTotalSurveySubmissionsResponseSchema,
} from '@/domain/schemas/surveys/submissions/responses';

export class CreateSurveySubmissionBody extends createZodDto(
  createSurveySubmissionSchema,
) {}
export class CreateSurveySubmissionResponse extends createZodDto(
  createSurveySubmissionResponseSchema,
) {}

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

export class GetSurveyUrlResponse extends createZodDto(
  getSurveyUrlResponseSchema,
) {}

export class DeclineSurveySubmissionBody extends createZodDto(
  declineSurveySubmissionSchema,
) {}
