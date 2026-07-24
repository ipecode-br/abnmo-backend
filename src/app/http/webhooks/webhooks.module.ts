import { Module } from '@nestjs/common';

import { SignatureModule } from '@/app/signature/signature.module';

import { SurveysModule } from '../surveys/surveys.module';
import { SurveySignatureWebhookUseCase } from './use-cases/survey-signature-webhook.use-case';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [SignatureModule, SurveysModule],
  controllers: [WebhooksController],
  providers: [SurveySignatureWebhookUseCase],
})
export class WebhooksModule {}
