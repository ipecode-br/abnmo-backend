import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponse } from '@/common/dtos';
import { Log } from '@/common/log/log.decorator';

import { CreateSurveyBody } from './surveys.dtos';
import { CreateSurveyUseCase } from './use-cases/create-survey.use-case';

@Roles(['member'])
@ApiTags('Catalogação')
@Controller('surveys')
export class SurveysController {
  constructor(private readonly createSurveyUseCase: CreateSurveyUseCase) {}

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
}
