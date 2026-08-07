import { SQSClient } from '@aws-sdk/client-sqs';
import { Global, Module } from '@nestjs/common';

import { EnqueueEmailUseCase } from './use-cases/enqueue-email.use-case';

@Global()
@Module({
  imports: [],
  providers: [
    { provide: SQSClient, useValue: new SQSClient({}) },
    EnqueueEmailUseCase,
  ],
  exports: [EnqueueEmailUseCase],
})
export class QueueModule {}
