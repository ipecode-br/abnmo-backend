import { Injectable } from '@nestjs/common';

import { CompleteSurveyUseCase } from '@/app/http/surveys/use-cases/complete-survey.use-case';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { SURVEY_SIGNATURE_METADATA_KEY } from '@/config';
import type { SurveySignatureWebhook } from '@/domain/schemas/webhooks/signature';

import { CreateWebhookEventUseCase } from './create-webhook-event.use-case';
import { UpdateWebhookEventStatusUseCase } from './update-webhook-event-status.use-case';

interface SurveySignatureWebhookOutput {
  success: boolean;
  message: string;
}

@Injectable()
@Log()
export class SurveySignatureWebhookUseCase {
  constructor(
    private readonly updateSurveyStatusUseCase: CompleteSurveyUseCase,
    private readonly createWebhookEventUseCase: CreateWebhookEventUseCase,
    private readonly updateWebhookEventStatusUseCase: UpdateWebhookEventStatusUseCase,
    private readonly logger: LogService,
  ) {}

  async execute({
    document,
    event,
  }: SurveySignatureWebhook): Promise<SurveySignatureWebhookOutput> {
    const logData = {
      eventName: event.name,
      documentKey: document.key,
      documentStatus: document.status,
    };

    this.logger.log('ClickSign webhook received', logData);

    const webhookEvent = await this.createWebhookEventUseCase.execute({
      payload: { event, document },
      event: 'sign_survey',
    });

    const metadataKey = document.metadata?.key;

    if (metadataKey !== SURVEY_SIGNATURE_METADATA_KEY) {
      this.logger.log('ClickSign webhook bypassed – metadata key mismatch', {
        ...logData,
        metadataKey,
      });

      return {
        success: true,
        message: 'Evento de webhook recebido com sucesso.',
      };
    }

    const CLICKSIGN_COMPLETION_EVENTS = [
      'auto_close',
      'close',
      'document_closed',
    ];

    if (!CLICKSIGN_COMPLETION_EVENTS.includes(event.name)) {
      this.logger.log('ClickSign webhook bypassed – event mismatch', logData);

      return {
        success: true,
        message: 'Evento de webhook recebido com sucesso.',
      };
    }

    try {
      await this.updateSurveyStatusUseCase.execute({
        signatureId: document.key,
      });
    } catch {
      await this.updateWebhookEventStatusUseCase.execute({
        id: webhookEvent.id,
        status: 'failed',
      });
      return {
        success: true,
        message: 'Status da catalogação atualizado com sucesso.',
      };
    }

    await this.updateWebhookEventStatusUseCase.execute({
      id: webhookEvent.id,
      status: 'success',
    });

    return {
      success: true,
      message: 'Status da catalogação atualizado com sucesso.',
    };
  }
}
