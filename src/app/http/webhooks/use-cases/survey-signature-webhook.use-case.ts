import { Injectable } from '@nestjs/common';

import { CompleteSurveyUseCase } from '@/app/http/surveys/use-cases/complete-survey.use-case';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { SurveySignatureWebhook } from '@/domain/schemas/webhooks/signature';

interface SurveySignatureWebhookOutput {
  success: boolean;
  message: string;
}

@Injectable()
@Log()
export class SurveySignatureWebhookUseCase {
  constructor(
    private readonly updateSurveyStatusUseCase: CompleteSurveyUseCase,
    private readonly logger: LogService,
  ) {}

  async execute({
    document,
    event,
  }: SurveySignatureWebhook): Promise<SurveySignatureWebhookOutput> {
    this.logger.log('ClickSign webhook received', {
      eventName: event.name,
      documentKey: document.key,
      documentStatus: document.status,
    });

    const CLICKSIGN_COMPLETION_EVENTS = [
      'auto_close',
      'close',
      'document_closed',
    ];

    if (!CLICKSIGN_COMPLETION_EVENTS.includes(event.name)) {
      return {
        success: true,
        message: 'Evento de webhook recebido com sucesso.',
      };
    }

    await this.updateSurveyStatusUseCase.execute({ signatureId: document.key });

    return {
      success: true,
      message: 'Status da catalogação atualizado com sucesso.',
    };
  }
}
