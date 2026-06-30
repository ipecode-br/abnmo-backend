import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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

@Roles(['member'])
@ApiTags('Catalogação')
@Controller('surveys')
export class SurveysController {
  constructor(
    private readonly createSurveyUseCase: CreateSurveyUseCase,
    private readonly getSurveysUseCase: GetSurveysUseCase,
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
}
