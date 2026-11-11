import { SQSClient } from '@aws-sdk/client-sqs';
import { Global, Module } from '@nestjs/common';

import { EnqueueEmailUseCase } from './use-cases/enqueue-email.use-case';
import { EnqueueSurveyAnalysisUseCase } from './use-cases/enqueue-survey-analysis.use-case';
import { EnqueueWhatsAppUseCase } from './use-cases/enqueue-whatsapp.use-case';

@Global()
@Module({
  providers: [
    { provide: SQSClient, useValue: new SQSClient({}) },
    EnqueueEmailUseCase,
    EnqueueSurveyAnalysisUseCase,
    EnqueueWhatsAppUseCase,
  ],
  exports: [
    EnqueueEmailUseCase,
    EnqueueSurveyAnalysisUseCase,
    EnqueueWhatsAppUseCase,
  ],
})
export class QueueModule {}
