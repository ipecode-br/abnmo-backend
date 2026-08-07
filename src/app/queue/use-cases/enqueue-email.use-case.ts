import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { EnvService } from '@/env/env.service';
import type { SendEmailJob } from '@/shared/queue/email.dto';
import type { MessageEnvelope } from '@/shared/queue/envelope';

@Injectable()
@Log()
export class EnqueueEmailUseCase {
  private readonly queueUrl: string;

  constructor(
    private readonly logger: LogService,
    private readonly sqs: SQSClient,
    private readonly envService: EnvService,
  ) {
    this.queueUrl = this.envService.get('EMAIL_QUEUE_URL');
  }

  async execute(job: SendEmailJob): Promise<void> {
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

    this.logger.log('E-mail job enqueued', {
      template: job.template,
      to: job.to,
    });
  }
}
