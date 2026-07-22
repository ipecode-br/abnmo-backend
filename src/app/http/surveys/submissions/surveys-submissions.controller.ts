import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { Dashboard } from '@/common/decorators/dashboard.decorator';
import { RequireFeature } from '@/common/decorators/require-feature.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse } from '@/common/dtos';
import { Log } from '@/common/log/log.decorator';
import type { RequestUser } from '@/common/types';

import {
  CreateSurveySubmissionBody,
  CreateSurveySubmissionResponse,
  DeclineSurveySubmissionBody,
  GetSurveySubmissionResponse,
  GetSurveySubmissionsQuery,
  GetSurveySubmissionsResponse,
  GetTotalSurveySubmissionsQuery,
  GetTotalSurveySubmissionsResponse,
} from './surveys.dtos';
import { ApproveSurveySubmissionUseCase } from './use-cases/approve-survey-submission.use-case';
import { ConfirmSurveySubmissionUploadUseCase } from './use-cases/confirm-survey-submission-upload.use-case';
import { CreateSurveySubmissionUseCase } from './use-cases/create-survey-submission.use-case';
import { DeclineSurveySubmissionUseCase } from './use-cases/decline-survey-submission.use-case';
import { GetSurveySubmissionUseCase } from './use-cases/get-survey-submission.use-case';
import { GetSurveySubmissionsUseCase } from './use-cases/get-survey-submissions.use-case';
import { GetTotalSurveySubmissionsUseCase } from './use-cases/get-total-survey-submissions.use-case';

@ApiTags('Catalogação')
@Controller('survey-submissions')
export class SurveysSubmissionsController {
  constructor(
    private readonly approveSurveySubmissionUseCase: ApproveSurveySubmissionUseCase,
    private readonly confirmSurveySubmissionUploadUseCase: ConfirmSurveySubmissionUploadUseCase,
    private readonly createSurveySubmissionUseCase: CreateSurveySubmissionUseCase,
    private readonly declineSurveySubmissionUseCase: DeclineSurveySubmissionUseCase,
    private readonly getSurveySubmissionUseCase: GetSurveySubmissionUseCase,
    private readonly getSurveySubmissionsUseCase: GetSurveySubmissionsUseCase,
    private readonly getTotalSurveySubmissionsUseCase: GetTotalSurveySubmissionsUseCase,
  ) {}

  @Dashboard()
  @Post()
  @Log('init_survey')
  @ApiOperation({ summary: 'Inicia o formulário de catalogação' })
  @ZodResponse({ type: CreateSurveySubmissionResponse, status: 201 })
  async initSurvey(
    @Body() body: CreateSurveySubmissionBody,
  ): Promise<CreateSurveySubmissionResponse> {
    const data = await this.createSurveySubmissionUseCase.execute(body);

    return {
      success: true,
      message: 'Catalogação iniciada com sucesso.',
      data,
    };
  }

  @Dashboard()
  @Post(':id/confirm-upload')
  @Log('init_survey')
  @ApiOperation({ summary: 'Confirma o upload do documento' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async confirmDocumentUpload(@Param('id') id: string): Promise<BaseResponse> {
    await this.confirmSurveySubmissionUploadUseCase.execute({ id });

    return {
      success: true,
      message: 'Documento confirmado com sucesso.',
    };
  }

  @Get()
  @RequireFeature('read:survey:others')
  @ApiOperation({ summary: 'Lista submissões de catalogação' })
  @ZodResponse({ type: GetSurveySubmissionsResponse, status: 200 })
  async getSurveySubmissions(
    @Query() query: GetSurveySubmissionsQuery,
    @User() user: RequestUser,
  ): Promise<GetSurveySubmissionsResponse> {
    const data = await this.getSurveySubmissionsUseCase.execute({
      ...query,
      user,
    });

    return {
      success: true,
      message: 'Lista de submissões retornada com sucesso.',
      data,
    };
  }

  // TODO: move this to a survey stats controller
  @Get('total')
  @RequireFeature('read:survey:others')
  @ApiOperation({ summary: 'Total de submissões de catalogação' })
  @ZodResponse({ type: GetTotalSurveySubmissionsResponse, status: 200 })
  async getTotalSurveySubmissions(
    @Query() query: GetTotalSurveySubmissionsQuery,
    @User() user: RequestUser,
  ): Promise<GetTotalSurveySubmissionsResponse> {
    const total = await this.getTotalSurveySubmissionsUseCase.execute({
      ...query,
      user,
    });

    return {
      success: true,
      message: 'Total de submissões retornado com sucesso.',
      data: { total },
    };
  }

  @Get(':id')
  @RequireFeature(['read:survey', 'read:survey:others'])
  @ApiOperation({ summary: 'Detalhes de uma submissão de catalogação' })
  @ZodResponse({ type: GetSurveySubmissionResponse, status: 200 })
  async getSurveySubmissionDetails(
    @Param('id') id: string,
    @User() user: RequestUser,
  ): Promise<GetSurveySubmissionResponse> {
    const data = await this.getSurveySubmissionUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Detalhes da submissão retornados com sucesso.',
      data,
    };
  }

  @Patch(':id/approve')
  @Log('approve_survey')
  @RequireFeature('review:survey')
  @ApiOperation({ summary: 'Aprova uma submissão de catalogação' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async approveSurveySubmission(
    @Param('id') id: string,
    @User() user: RequestUser,
  ): Promise<BaseResponse> {
    await this.approveSurveySubmissionUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Submissão aprovada com sucesso.',
    };
  }

  @Patch(':id/decline')
  @Log('decline_survey')
  @RequireFeature('review:survey')
  @ApiOperation({ summary: 'Recusa uma submissão de catalogação' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async declineSurveySubmission(
    @Param('id') id: string,
    @User() user: RequestUser,
    @Body() body: DeclineSurveySubmissionBody,
  ): Promise<BaseResponse> {
    await this.declineSurveySubmissionUseCase.execute({
      id,
      user,
      reason: body.reason,
    });

    return {
      success: true,
      message: 'Submissão recusada com sucesso.',
    };
  }
}
