import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { WebhookEvent } from '@/domain/entities/webhook-event';
import type { WebhookEventStatus } from '@/domain/enums/webhook-events';

interface UpdateWebhookEventStatusUseCaseInput {
  id: string;
  status: WebhookEventStatus;
}

@Injectable()
@Log()
export class UpdateWebhookEventStatusUseCase {
  constructor(
    @InjectRepository(WebhookEvent)
    private readonly webhookEventsRepository: Repository<WebhookEvent>,
    private readonly logger: LogService,
  ) {}

  async execute({
    id,
    status,
  }: UpdateWebhookEventStatusUseCaseInput): Promise<void> {
    await this.webhookEventsRepository.update(id, { status });

    this.logger.log('Webhook event status updated', { id, status });
  }
}
