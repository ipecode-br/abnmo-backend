import { createZodDto } from 'nestjs-zod';

import { createSurveySchema } from '@/domain/schemas/surveys/requests';

export class CreateSurveyBody extends createZodDto(createSurveySchema) {}
