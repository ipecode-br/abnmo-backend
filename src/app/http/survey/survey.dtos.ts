import { createZodDto } from 'nestjs-zod';

import {
  completeSurveySchema,
  initSurveySchema,
} from '@/domain/schemas/survey/requests';

export class InitSurveyBody extends createZodDto(initSurveySchema) {}

export class CompleteSurveyBody extends createZodDto(completeSurveySchema) {}
