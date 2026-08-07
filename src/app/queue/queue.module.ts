import { SQSClient } from '@aws-sdk/client-sqs';
import { Global, Module } from '@nestjs/common';

import { EnvModule } from '@/env/env.module';

import { EnqueueEmailUseCase } from './use-cases/enqueue-email.use-case';

@Global()
@Module({
  imports: [EnvModule],
  providers: [
    { provide: SQSClient, useValue: new SQSClient({}) },
    EnqueueEmailUseCase,
  ],
  exports: [EnqueueEmailUseCase],
})
export class QueueModule {}
