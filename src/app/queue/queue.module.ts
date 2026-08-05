import { SQSClient } from '@aws-sdk/client-sqs';
import { Global, Module } from '@nestjs/common';

import { EnvModule } from '@/env/env.module';

import { QueueService } from './queue.service';

@Global()
@Module({
  imports: [EnvModule],
  providers: [
    { provide: SQSClient, useValue: new SQSClient({}) },
    QueueService,
  ],
  exports: [QueueService],
})
export class QueueModule {}
