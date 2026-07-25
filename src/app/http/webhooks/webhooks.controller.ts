import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { Public } from '@/common/decorators/public.decorator';
import { RequireFeature } from '@/common/decorators/require-feature.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse } from '@/common/dtos';
import { Log } from '@/common/log/log.decorator';
import type { RequestUser } from '@/common/types';

import { GetWebhookEventsUseCase } from './use-cases/get-webhook-events.use-case';
import { SurveySignatureWebhookUseCase } from './use-cases/survey-signature-webhook.use-case';
import {
  GetWebhookEventsQuery,
  GetWebhookEventsResponse,
  SurveySignatureWebhookBody,
} from './webhooks.dtos';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly surveySignatureWebhookUseCase: SurveySignatureWebhookUseCase,
    private readonly getWebhookEventsUseCase: GetWebhookEventsUseCase,
  ) {}

  @Get('/events')
  @RequireFeature('read:webhook')
  @ApiOperation({ summary: 'Lista todos os eventos de webhook' })
  @ZodResponse({ type: GetWebhookEventsResponse, status: 200 })
  async getWebhookEvents(
    @Query() query: GetWebhookEventsQuery,
    @User() user: RequestUser,
  ): Promise<GetWebhookEventsResponse> {
    const data = await this.getWebhookEventsUseCase.execute({ user, ...query });

    return {
      success: true,
      message: 'Lista de eventos de webhook retornada com sucesso.',
      data,
    };
  }

  @Public()
  @Post('signatures/survey')
  @Log('signature_survey_webhook')
  @ApiOperation({ summary: 'Recebe webhooks de assinatura do ClickSign' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async surveySignature(
    @Body() body: SurveySignatureWebhookBody,
  ): Promise<BaseResponse> {
    return this.surveySignatureWebhookUseCase.execute(body);
  }
}
