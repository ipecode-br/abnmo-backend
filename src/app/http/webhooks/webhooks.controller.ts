import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { Public } from '@/common/decorators/public.decorator';
import { BaseResponse } from '@/common/dtos';
import { Log } from '@/common/log/log.decorator';

import { SurveySignatureWebhookUseCase } from './use-cases/survey-signature-webhook.use-case';
import { SurveySignatureWebhookBody } from './webhooks.dtos';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly surveySignatureWebhookUseCase: SurveySignatureWebhookUseCase,
  ) {}

  @Public()
  @Post('survey-signature')
  @Log('survey_signature_webhook')
  @ApiOperation({ summary: 'Recebe webhooks de assinatura do ClickSign' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async surveySignature(
    @Body() body: SurveySignatureWebhookBody,
  ): Promise<BaseResponse> {
    return this.surveySignatureWebhookUseCase.execute(body);
  }
}
