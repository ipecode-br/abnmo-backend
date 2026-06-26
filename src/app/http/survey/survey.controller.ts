import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Express } from 'express';
import { ZodResponse } from 'nestjs-zod';

import { Public } from '@/common/decorators/public.decorator';
import { BaseResponse } from '@/common/dtos';
import { FileValidationPipe } from '@/common/file-validation.pipe';
import { Log } from '@/common/log/log.decorator';
import { MIME_TYPES } from '@/constants/mime-types';

import { CompleteSurveyBody, InitSurveyBody } from './survey.dtos';
import { CompleteSurveyUseCase } from './use-cases/complete-survey.use-case';
import { InitSurveyUseCase } from './use-cases/init-survey.use-case';

@Public()
@ApiTags('Catalogação')
@Controller('surveys')
export class SurveyController {
  constructor(
    private readonly initSurveyUseCase: InitSurveyUseCase,
    private readonly completeSurveyUseCase: CompleteSurveyUseCase,
  ) {}

  @Post('/init')
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
}
