import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Express } from 'express';
import { ZodResponse } from 'nestjs-zod';

import { Public } from '@/common/decorators/public.decorator';
import { RequireFeature } from '@/common/decorators/require-feature.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponse } from '@/common/dtos';
import { FileValidationPipe } from '@/common/file-validation.pipe';
import { Log } from '@/common/log/log.decorator';
import { MIME_TYPES } from '@/constants/mime-types';

import {
  CompleteSurveyBody,
  GetSurveySubmissionResponse,
  GetSurveySubmissionsQuery,
  GetSurveySubmissionsResponse,
  GetTotalSurveySubmissionsQuery,
  GetTotalSurveySubmissionsResponse,
  InitSurveyBody,
} from './surveys.dtos';
import { CompleteSurveyUseCase } from './use-cases/complete-survey.use-case';
import { GetSurveySubmissionUseCase } from './use-cases/get-survey-submission.use-case';
import { GetSurveySubmissionsUseCase } from './use-cases/get-survey-submissions.use-case';
import { GetTotalSurveySubmissionsUseCase } from './use-cases/get-total-survey-submissions.use-case';
import { InitSurveyUseCase } from './use-cases/init-survey.use-case';

@Roles(['member'])
@ApiTags('Catalogação')
@Controller('surveys')
export class SurveysController {
  constructor(
    private readonly completeSurveyUseCase: CompleteSurveyUseCase,
    private readonly getSurveySubmissionUseCase: GetSurveySubmissionUseCase,
    private readonly getSurveySubmissionsUseCase: GetSurveySubmissionsUseCase,
    private readonly getTotalSurveySubmissionsUseCase: GetTotalSurveySubmissionsUseCase,
    private readonly initSurveyUseCase: InitSurveyUseCase,
  ) {}

  @Post('/init')
  @Public()
  @Log('init_survey')
  @UseInterceptors(FileInterceptor('medicalReport'))
  @ApiOperation({ summary: 'Inicia o formulário de catalogação' })
  @ZodResponse({ type: BaseResponse, status: 201 })
  async initSurvey(
    @Body() body: InitSurveyBody,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 4 * 1024 * 1024, // 4mb
        allowedMimeTypes: [
          MIME_TYPES.jpg,
          MIME_TYPES.jpeg,
          MIME_TYPES.png,
          MIME_TYPES.pdf,
        ],
      }),
    )
    medicalReport: Express.Multer.File,
  ): Promise<BaseResponse> {
    // TODO: handle medicalReport upload
    void medicalReport;

    await this.initSurveyUseCase.execute(body);

    return {
      success: true,
      message: 'Catalogação iniciada com sucesso.',
    };
  }

  @Post('/complete')
  @Public()
  @Log('complete_survey')
  @ApiOperation({ summary: 'Finaliza o formulário de catalogação' })
  @ZodResponse({ type: BaseResponse, status: 201 })
  async completeSurvey(
    @Body() body: CompleteSurveyBody,
  ): Promise<BaseResponse> {
    await this.completeSurveyUseCase.execute(body);

    return {
      success: true,
      message: 'Catalogação enviada com sucesso.',
    };
  }

  @Get('submissions')
  @RequireFeature('read:survey')
  @ApiOperation({ summary: 'Lista submissões de catalogação' })
  @ZodResponse({ type: GetSurveySubmissionsResponse, status: 200 })
  async getSurveySubmissions(
    @Query() query: GetSurveySubmissionsQuery,
  ): Promise<GetSurveySubmissionsResponse> {
    const data = await this.getSurveySubmissionsUseCase.execute(query);

    return {
      success: true,
      message: 'Lista de submissões retornada com sucesso.',
      data,
    };
  }

  @Get('submissions/details/:id')
  @RequireFeature('read:survey')
  @ApiOperation({ summary: 'Detalhes de uma submissão de catalogação' })
  @ZodResponse({ type: GetSurveySubmissionResponse, status: 200 })
  async getSurveySubmissionDetails(
    @Param('id') id: string,
  ): Promise<GetSurveySubmissionResponse> {
    const data = await this.getSurveySubmissionUseCase.execute(id);

    return {
      success: true,
      message: 'Detalhes da submissão retornados com sucesso.',
      data,
    };
  }

  @Get('submissions/total')
  @RequireFeature('read:survey')
  @ApiOperation({ summary: 'Total de submissões de catalogação' })
  @ZodResponse({ type: GetTotalSurveySubmissionsResponse, status: 200 })
  async getTotalSurveySubmissions(
    @Query() query: GetTotalSurveySubmissionsQuery,
  ): Promise<GetTotalSurveySubmissionsResponse> {
    const total = await this.getTotalSurveySubmissionsUseCase.execute(query);

    return {
      success: true,
      message: 'Total de submissões retornado com sucesso.',
      data: { total },
    };
  }
}
