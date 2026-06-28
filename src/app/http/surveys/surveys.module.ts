import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CryptographyModule } from '@/app/cryptography/cryptography.module';
import { Survey } from '@/domain/entities/survey';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';

import { SurveysController } from './surveys.controller';
import { CompleteSurveyUseCase } from './use-cases/complete-survey.use-case';
import { GetSurveySubmissionUseCase } from './use-cases/get-survey-submission.use-case';
import { GetSurveySubmissionsUseCase } from './use-cases/get-survey-submissions.use-case';
import { GetTotalSurveySubmissionsUseCase } from './use-cases/get-total-survey-submissions.use-case';
import { InitSurveyUseCase } from './use-cases/init-survey.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([SurveySubmission, Survey, User]),
    CryptographyModule,
  ],
  controllers: [SurveysController],
  providers: [
    InitSurveyUseCase,
    CompleteSurveyUseCase,
    GetSurveySubmissionsUseCase,
    GetSurveySubmissionUseCase,
    GetTotalSurveySubmissionsUseCase,
  ],
})
export class SurveysModule {}
