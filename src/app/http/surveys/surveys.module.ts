import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CryptographyModule } from '@/app/cryptography/cryptography.module';
import { SignatureModule } from '@/app/signature/signature.module';
import { StorageModule } from '@/app/storage/storage.module';
import { Document } from '@/domain/entities/document';
import { Survey } from '@/domain/entities/survey';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';
import { EnvModule } from '@/env/env.module';

import { SurveysSubmissionsController } from './submissions/surveys-submissions.controller';
import { ApproveSurveySubmissionUseCase } from './submissions/use-cases/approve-survey-submission.use-case';
import { ConfirmSurveySubmissionUploadUseCase } from './submissions/use-cases/confirm-survey-submission-upload.use-case';
import { CreateSurveySubmissionUseCase } from './submissions/use-cases/create-survey-submission.use-case';
import { DeclineSurveySubmissionUseCase } from './submissions/use-cases/decline-survey-submission.use-case';
import { GetSurveySubmissionUseCase } from './submissions/use-cases/get-survey-submission.use-case';
import { GetSurveySubmissionsUseCase } from './submissions/use-cases/get-survey-submissions.use-case';
import { GetTotalSurveySubmissionsUseCase } from './submissions/use-cases/get-total-survey-submissions.use-case';
import { SurveysController } from './surveys.controller';
import { CreateSurveyUseCase } from './use-cases/create-survey.use-case';
import { GetSurveysUseCase } from './use-cases/get-surveys.use-case';
import { SendSurveyReminderUseCase } from './use-cases/send-survey-reminder.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([SurveySubmission, Survey, User, Document]),
    EnvModule,
    CryptographyModule,
    SignatureModule,
    StorageModule,
  ],
  controllers: [SurveysController, SurveysSubmissionsController],
  providers: [
    ApproveSurveySubmissionUseCase,
    ConfirmSurveySubmissionUploadUseCase,
    CreateSurveySubmissionUseCase,
    CreateSurveyUseCase,
    GetSurveySubmissionUseCase,
    GetSurveySubmissionsUseCase,
    GetSurveysUseCase,
    GetTotalSurveySubmissionsUseCase,
    DeclineSurveySubmissionUseCase,
    SendSurveyReminderUseCase,
  ],
})
export class SurveysModule {}
