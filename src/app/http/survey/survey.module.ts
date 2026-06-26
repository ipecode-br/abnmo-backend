import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CryptographyModule } from '@/app/cryptography/cryptography.module';
import { Survey } from '@/domain/entities/survey';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';

import { SurveyController } from './survey.controller';
import { CompleteSurveyUseCase } from './use-cases/complete-survey.use-case';
import { InitSurveyUseCase } from './use-cases/init-survey.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([SurveySubmission, Survey, User]),
    CryptographyModule,
  ],
  controllers: [SurveyController],
  providers: [InitSurveyUseCase, CompleteSurveyUseCase],
})
export class SurveyModule {}
