import { createZodDto } from 'nestjs-zod';

import {
  createSurveySchema,
  getSurveysQuerySchema,
} from '@/domain/schemas/surveys/requests';
import {
  getSurveyResponseSchema,
  getSurveysResponseSchema,
} from '@/domain/schemas/surveys/responses';

export class CreateSurveyBody extends createZodDto(createSurveySchema) {}

export class GetSurveysQuery extends createZodDto(getSurveysQuerySchema) {}
export class GetSurveysResponse extends createZodDto(
  getSurveysResponseSchema,
) {}

export class GetSurveyResponse extends createZodDto(getSurveyResponseSchema) {}
