import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { EnvService } from '@/env/env.service';
import type { MessageEnvelope } from '@/shared/queue/envelope';
import type { SendWhatsAppJob } from '@/shared/queue/schemas/whatsapp';
import { generateQueueIdempotencyKey } from '@/shared/queue/utils';
import { anonymizePhoneE164 } from '@/utils/anonymize';

@Injectable()
@Log()
export class EnqueueWhatsAppUseCase {
  private readonly queueUrl: string;

  constructor(
    private readonly envService: EnvService,
    private readonly logger: LogService,
    private readonly sqs: SQSClient,
  ) {
    this.queueUrl = this.envService.get('WHATSAPP_QUEUE_URL');
  }

  async execute(job: SendWhatsAppJob): Promise<void> {
    const message: MessageEnvelope<SendWhatsAppJob> = {
      version: 1,
      type: 'whatsapp',
      payload: job,
      idempotencyKey: generateQueueIdempotencyKey(),
    };

    try {
      await this.sqs.send(
        new SendMessageCommand({
          QueueUrl: this.queueUrl,
          MessageBody: JSON.stringify(message),
        }),
      );

      this.logger.log('WhatsApp job enqueued', {
        template: job.template,
        phone: job.to,
      });
    } catch (error) {
      this.logger.error('Failed to enqueue WhatsApp job', {
        template: job.template,
        phone: job.to,
        error: error instanceof Error ? error.message : String(error),
      });

      Sentry.captureException(error, {
        captureContext: {
          level: 'error',
          extra: {
            template: job.template,
            phone: anonymizePhoneE164(job.to),
          },
        },
      });
    }
  }
}
