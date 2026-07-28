import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { Dashboard } from '@/common/decorators/dashboard.decorator';
import { RequireFeature } from '@/common/decorators/require-feature.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse, UUIDParam } from '@/common/dtos';
import { Log } from '@/common/log/log.decorator';
import type { RequestUser } from '@/common/types';

import {
  CreateSurveyBody,
  GetSurveyResponse,
  GetSurveysQuery,
  GetSurveysResponse,
} from './surveys.dtos';
import { CreateSurveyUseCase } from './use-cases/create-survey.use-case';
import { GetSurveyUseCase } from './use-cases/get-survey.use-case';
import { GetSurveysUseCase } from './use-cases/get-surveys.use-case';
import { SendSurveyReminderUseCase } from './use-cases/send-survey-reminder.use-case';

@ApiTags('Catalogação')
@Controller('surveys')
export class SurveysController {
  constructor(
    private readonly createSurveyUseCase: CreateSurveyUseCase,
    private readonly getSurveyUseCase: GetSurveyUseCase,
    private readonly getSurveysUseCase: GetSurveysUseCase,
    private readonly sendSurveyReminderUseCase: SendSurveyReminderUseCase,
  ) {}

  @Dashboard()
  @Post('complete')
  @Log('complete_survey')
  @ApiOperation({ summary: 'Finaliza o formulário de catalogação' })
  @ZodResponse({ type: BaseResponse, status: 201 })
  async completeSurvey(@Body() body: CreateSurveyBody): Promise<BaseResponse> {
    await this.createSurveyUseCase.execute(body);

    return {
      success: true,
      message: 'Catalogação enviada com sucesso.',
    };
  }

  @Get()
  @RequireFeature('read:survey:others')
  @ApiOperation({ summary: 'Lista catalogações' })
  @ZodResponse({ type: GetSurveysResponse, status: 200 })
  async getSurveys(
    @Query() query: GetSurveysQuery,
    @User() user: RequestUser,
  ): Promise<GetSurveysResponse> {
    const data = await this.getSurveysUseCase.execute({ ...query, user });

    return {
      success: true,
      message: 'Lista de catalogações retornada com sucesso.',
      data,
    };
  }

  @Get(':id')
  @RequireFeature(['read:survey', 'read:survey:others'])
  @ApiOperation({ summary: 'Detalhes de uma catalogação' })
  @ZodResponse({ type: GetSurveyResponse, status: 200 })
  async getSurvey(
    @Param() { id }: UUIDParam,
    @User() user: RequestUser,
  ): Promise<GetSurveyResponse> {
    const data = await this.getSurveyUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Detalhes da catalogação retornados com sucesso.',
      data,
    };
  }

  @Post(':id/send-reminder')
  @RequireFeature('read:survey:others')
  @Log('send_survey_reminder')
  @ApiOperation({ summary: 'Envia lembrete de assinatura ao paciente' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async sendSignRemind(
    @Param() { id }: UUIDParam,
    @User() user: RequestUser,
  ): Promise<BaseResponse> {
    await this.sendSurveyReminderUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Lembrete enviado com sucesso.',
    };
  }
}
