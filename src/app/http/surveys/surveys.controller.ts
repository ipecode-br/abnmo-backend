import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { Public } from '@/common/decorators/public.decorator';
import { RequireFeature } from '@/common/decorators/require-feature.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponse } from '@/common/dtos';
import { Log } from '@/common/log/log.decorator';

import {
  CreateSurveyBody,
  GetSurveysQuery,
  GetSurveysResponse,
} from './surveys.dtos';
import { CreateSurveyUseCase } from './use-cases/create-survey.use-case';
import { GetSurveysUseCase } from './use-cases/get-surveys.use-case';
import { SendSurveyReminderUseCase } from './use-cases/send-survey-reminder.use-case';

@ApiTags('Catalogação')
@Controller('surveys')
@Roles(['member'])
export class SurveysController {
  constructor(
    private readonly createSurveyUseCase: CreateSurveyUseCase,
    private readonly getSurveysUseCase: GetSurveysUseCase,
    private readonly sendSurveyReminderUseCase: SendSurveyReminderUseCase,
  ) {}

  @Post('complete')
  @Public()
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
  ): Promise<GetSurveysResponse> {
    const data = await this.getSurveysUseCase.execute(query);

    return {
      success: true,
      message: 'Lista de catalogações retornada com sucesso.',
      data,
    };
  }

  @Post(':id/send-reminder')
  @RequireFeature('read:survey:others')
  @Log('send_survey_reminder')
  @ApiOperation({ summary: 'Envia lembrete de assinatura ao paciente' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async sendSignRemind(@Param('id') id: string): Promise<BaseResponse> {
    await this.sendSurveyReminderUseCase.execute(id);

    return {
      success: true,
      message: 'Lembrete enviado com sucesso.',
    };
  }
}
