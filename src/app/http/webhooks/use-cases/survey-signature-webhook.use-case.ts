import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

import { CompleteSurveyUseCase } from '@/app/http/surveys/use-cases/complete-survey.use-case';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { SURVEY_SIGNATURE_METADATA_KEY } from '@/config';

import { SurveySignatureWebhookBody } from '../webhooks.dtos';
import { UpdateWebhookEventStatusUseCase } from './update-webhook-event-status.use-case';

interface SurveySignatureWebhookUseCaseInput {
  payload: SurveySignatureWebhookBody;
  webhookEventId: string;
}

@Injectable()
@Log()
export class SurveySignatureWebhookUseCase {
  constructor(
    private readonly completeSurveyUseCase: CompleteSurveyUseCase,
    private readonly updateWebhookEventStatusUseCase: UpdateWebhookEventStatusUseCase,
    private readonly logger: LogService,
  ) {}

  async execute({
    payload,
    webhookEventId,
  }: SurveySignatureWebhookUseCaseInput): Promise<void> {
    const eventName = payload.event.name;
    const documentKey = payload.document.key;
    const documentStatus = payload.document.status;
    const logData = { eventName, documentKey, documentStatus };

    this.logger.log('Signature webhook received', logData);

    const metadataKey = payload.document.metadata?.key;

    if (metadataKey !== SURVEY_SIGNATURE_METADATA_KEY) {
      this.logger.log('Signature webhook bypassed – metadata key mismatch', {
        ...logData,
        metadataKey,
      });
      return;
    }

    const COMPLETION_EVENTS = ['auto_close', 'close', 'document_closed'];

    if (!COMPLETION_EVENTS.includes(eventName)) {
      this.logger.log('Signature webhook bypassed – event mismatch', logData);
      return;
    }

    try {
      await this.completeSurveyUseCase.execute({
        signatureDocumentId: documentKey,
      });
    } catch (error) {
      this.logger.error('Failed to complete survey from signature webhook', {
        ...logData,
        error: error instanceof Error ? error.message : String(error),
      });

      Sentry.captureException(error, {
        captureContext: {
          level: 'error',
          extra: { eventName, documentKey, documentStatus },
        },
      });

      await this.updateWebhookEventStatusUseCase.execute({
        id: webhookEventId,
        status: 'failed',
      });
      return;
    }

    await this.updateWebhookEventStatusUseCase.execute({
      id: webhookEventId,
      status: 'success',
    });
  }
}
