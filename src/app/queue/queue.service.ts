import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';

import { EnvService } from '@/env/env.service';
import { SendEmailJob } from '@/shared/queue/email.dto';
import { MessageEnvelope } from '@/shared/queue/envelope';

export const SQS_CLIENT = 'SQS_CLIENT';

@Injectable()
export class QueueService {
  private readonly queueUrl: string;

  constructor(
    private readonly sqs: SQSClient,
    private readonly envService: EnvService,
  ) {
    this.queueUrl = this.envService.get('EMAIL_QUEUE_URL');
  }

  async enqueueEmail(job: SendEmailJob): Promise<void> {
    const message: MessageEnvelope<SendEmailJob> = {
      version: 1,
      type: 'email',
      payload: job,
    };

    await this.sqs.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(message),
      }),
    );
  }
}
