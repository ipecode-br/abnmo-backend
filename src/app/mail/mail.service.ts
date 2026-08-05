import { Injectable } from '@nestjs/common';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { SendEmailJob } from '@/shared/queue/email.dto';

import { QueueService } from '../queue/queue.service';

@Injectable()
@Log()
export class MailService {
  constructor(
    private readonly logger: LogService,
    private readonly queue: QueueService,
  ) {}

  async send(job: SendEmailJob): Promise<void> {
    await this.queue.enqueueEmail(job);

    this.logger.log('E-mail job enqueued', {
      template: job.template,
      to: job.to,
    });
  }
}
