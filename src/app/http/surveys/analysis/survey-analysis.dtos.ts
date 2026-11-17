import { createZodDto } from 'nestjs-zod';

import {
  reanalyzeSurveyAnswerSchema,
  updateSurveyAnalysisTermsSchema,
} from '@/domain/schemas/surveys/analysis/requests';
import { getSurveyAnalysesResponseSchema } from '@/domain/schemas/surveys/analysis/responses';

export class GetSurveyAnalysesResponse extends createZodDto(
  getSurveyAnalysesResponseSchema,
) {}

export class UpdateSurveyAnalysisTermsBody extends createZodDto(
  updateSurveyAnalysisTermsSchema,
) {}

export class ReanalyzeSurveyAnswerBody extends createZodDto(
  reanalyzeSurveyAnswerSchema,
) {}
