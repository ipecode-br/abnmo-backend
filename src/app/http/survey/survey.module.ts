import { Module } from '@nestjs/common';

import { SurveyController } from './survey.controller';

@Module({
  imports: [],
  controllers: [SurveyController],
})
export class SurveyModule {}
