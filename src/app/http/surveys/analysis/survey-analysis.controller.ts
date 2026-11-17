import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { RequireFeature } from '@/common/decorators/require-feature.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse, UUIDParam } from '@/common/dtos';
import { Log } from '@/common/log/log.decorator';
import type { RequestUser } from '@/common/types';

import {
  GetSurveyAnalysesResponse,
  ReanalyzeSurveyAnswerBody,
  UpdateSurveyAnalysisTermsBody,
} from './survey-analysis.dtos';
import { GetSurveyAnalysesUseCase } from './use-cases/get-survey-analyses.use-case';
import { ReanalyzeSurveyAnswerUseCase } from './use-cases/reanalyze-survey-answer.use-case';
import { UpdateSurveyAnalysisTermsUseCase } from './use-cases/update-survey-analysis-terms.use-case';

@ApiTags('Catalogação')
@Controller('survey-analysis')
export class SurveyAnalysisController {
  constructor(
    private readonly getSurveyAnalysesUseCase: GetSurveyAnalysesUseCase,
    private readonly reanalyzeSurveyAnswerUseCase: ReanalyzeSurveyAnswerUseCase,
    private readonly updateSurveyAnalysisTermsUseCase: UpdateSurveyAnalysisTermsUseCase,
  ) {}

  @Get(':id')
  @RequireFeature('read:survey:others')
  @ApiOperation({
    summary: 'Lista as análises de respostas da catalogação de um paciente',
  })
  @ZodResponse({ type: GetSurveyAnalysesResponse, status: 200 })
  async getSurveyAnalyses(
    @Param() { id }: UUIDParam,
    @User() user: RequestUser,
  ): Promise<GetSurveyAnalysesResponse> {
    const data = await this.getSurveyAnalysesUseCase.execute({
      patientId: id,
      user,
    });

    return {
      success: true,
      message: 'Análises retornadas com sucesso.',
      data,
    };
  }

  @Patch(':id/terms')
  @Log('update_survey_analysis')
  @RequireFeature('update:survey:others')
  @ApiOperation({ summary: 'Atualiza os termos de uma análise' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async updateSurveyAnalysisTerms(
    @Param() { id }: UUIDParam,
    @Body() body: UpdateSurveyAnalysisTermsBody,
    @User() user: RequestUser,
  ): Promise<BaseResponse> {
    await this.updateSurveyAnalysisTermsUseCase.execute({
      id,
      terms: body.terms,
      user,
    });

    return {
      success: true,
      message: 'Termos atualizados com sucesso.',
    };
  }

  @Post('reanalyze')
  @Log('reanalyze_survey_answer')
  @RequireFeature('update:survey:others')
  @ApiOperation({ summary: 'Solicita uma nova análise para uma resposta' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async reanalyzeSurveyAnswer(
    @Body() body: ReanalyzeSurveyAnswerBody,
    @User() user: RequestUser,
  ): Promise<BaseResponse> {
    await this.reanalyzeSurveyAnswerUseCase.execute({ ...body, user });

    return {
      success: true,
      message: 'Nova análise solicitada com sucesso.',
    };
  }
}
