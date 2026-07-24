import { createZodDto } from 'nestjs-zod';

import { surveySignatureWebhookSchema } from '@/domain/schemas/webhooks/signature';

export class SurveySignatureWebhookBody extends createZodDto(
  surveySignatureWebhookSchema,
) {}
