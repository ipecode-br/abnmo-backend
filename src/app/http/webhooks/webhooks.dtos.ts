import { createZodDto } from 'nestjs-zod';

import { getWebhookEventsQuerySchema } from '@/domain/schemas/webhooks/requests';
import { getWebhookEventsResponseSchema } from '@/domain/schemas/webhooks/responses';
import { surveySignatureWebhookSchema } from '@/domain/schemas/webhooks/signature';

export class GetWebhookEventsQuery extends createZodDto(
  getWebhookEventsQuerySchema,
) {}

export class GetWebhookEventsResponse extends createZodDto(
  getWebhookEventsResponseSchema,
) {}

export class SurveySignatureWebhookBody extends createZodDto(
  surveySignatureWebhookSchema,
) {}
