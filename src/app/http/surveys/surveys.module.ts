import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CryptographyModule } from '@/app/cryptography/cryptography.module';
import { Survey } from '@/domain/entities/survey';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';

import { SurveysSubmissionsController } from './submissions/surveys-submissions.controller';
import { ApproveSurveySubmissionUseCase } from './submissions/use-cases/approve-survey-submission.use-case';
import { CreateSurveySubmissionUseCase } from './submissions/use-cases/create-survey-submission.use-case';
import { GetSurveySubmissionUseCase } from './submissions/use-cases/get-survey-submission.use-case';
import { GetSurveySubmissionsUseCase } from './submissions/use-cases/get-survey-submissions.use-case';
import { GetTotalSurveySubmissionsUseCase } from './submissions/use-cases/get-total-survey-submissions.use-case';
import { RejectSurveySubmissionUseCase } from './submissions/use-cases/reject-survey-submission.use-case';
import { SurveysController } from './surveys.controller';
import { CreateSurveyUseCase } from './use-cases/create-survey.use-case';
import { GetSurveysUseCase } from './use-cases/get-surveys.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([SurveySubmission, Survey, User]),
    CryptographyModule,
  ],
  controllers: [SurveysController, SurveysSubmissionsController],
  providers: [
    CreateSurveySubmissionUseCase,
    CreateSurveyUseCase,
    GetSurveySubmissionsUseCase,
    GetSurveySubmissionUseCase,
    GetTotalSurveySubmissionsUseCase,
    GetSurveysUseCase,
    ApproveSurveySubmissionUseCase,
    RejectSurveySubmissionUseCase,
  ],
})
export class SurveysModule {}
