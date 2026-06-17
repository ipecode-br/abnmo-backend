import { createZodDto } from 'nestjs-zod';

import { initSurveySchema } from '@/domain/schemas/survey/requests';

export class InitSurveyDto extends createZodDto(initSurveySchema) {}
