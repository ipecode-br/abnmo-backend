import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { Public } from '@/common/decorators/public.decorator';
import { RequireFeature } from '@/common/decorators/require-feature.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse } from '@/common/dtos';
import { Log } from '@/common/log/log.decorator';
import type { RequestUser } from '@/common/types';

import { CreateWebhookEventUseCase } from './use-cases/create-webhook-event.use-case';
import { GetWebhookEventUseCase } from './use-cases/get-webhook-event.use-case';
import { GetWebhookEventsUseCase } from './use-cases/get-webhook-events.use-case';
import { SurveySignatureWebhookUseCase } from './use-cases/survey-signature-webhook.use-case';
import {
  GetWebhookEventResponse,
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
    private readonly getWebhookEventUseCase: GetWebhookEventUseCase,
    private readonly createWebhookEventUseCase: CreateWebhookEventUseCase,
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

  @Get('/events/:id')
  @RequireFeature('read:webhook')
  @ApiOperation({ summary: 'Detalhes de um evento de webhook' })
  @ZodResponse({ type: GetWebhookEventResponse, status: 200 })
  async getWebhookEvent(
    @Param('id') id: string,
    @User() user: RequestUser,
  ): Promise<GetWebhookEventResponse> {
    const data = await this.getWebhookEventUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Detalhes do evento de webhook retornados com sucesso.',
      data,
    };
  }

  @Public()
  @Post('signatures/survey')
  @Log('signature_survey_webhook')
  @ApiOperation({ summary: 'Recebe webhooks de assinatura do ClickSign' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async surveySignature(
    @Req() req: Request,
    @Body() body: SurveySignatureWebhookBody,
  ): Promise<BaseResponse> {
    const fullBody = req.body as unknown as Record<string, unknown>;

    const webhookEvent = await this.createWebhookEventUseCase.execute({
      event: 'sign_survey',
      payload: fullBody,
    });

    await this.surveySignatureWebhookUseCase.execute({
      webhookEventId: webhookEvent.id,
      payload: body,
    });

    return {
      success: true,
      message: 'Webhook de assinatura recebido com sucesso.',
    };
  }
}
