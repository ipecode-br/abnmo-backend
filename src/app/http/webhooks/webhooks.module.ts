import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SignatureModule } from '@/app/signature/signature.module';
import { WebhookEvent } from '@/domain/entities/webhook-event';

import { SurveysModule } from '../surveys/surveys.module';
import { CreateWebhookEventUseCase } from './use-cases/create-webhook-event.use-case';
import { GetWebhookEventUseCase } from './use-cases/get-webhook-event.use-case';
import { GetWebhookEventsUseCase } from './use-cases/get-webhook-events.use-case';
import { SurveySignatureWebhookUseCase } from './use-cases/survey-signature-webhook.use-case';
import { UpdateWebhookEventStatusUseCase } from './use-cases/update-webhook-event-status.use-case';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEvent]),
    SignatureModule,
    SurveysModule,
  ],
  controllers: [WebhooksController],
  providers: [
    CreateWebhookEventUseCase,
    GetWebhookEventUseCase,
    GetWebhookEventsUseCase,
    SurveySignatureWebhookUseCase,
    UpdateWebhookEventStatusUseCase,
  ],
})
export class WebhooksModule {}
