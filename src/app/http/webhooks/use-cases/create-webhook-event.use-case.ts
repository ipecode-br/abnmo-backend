import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { WebhookEvent } from '@/domain/entities/webhook-event';
import { WebhookEventType } from '@/domain/enums/webhook-events';

interface CreateWebhookEventUseCaseInput {
  event: WebhookEventType;
  payload: Record<string, unknown>;
}

@Injectable()
@Log()
export class CreateWebhookEventUseCase {
  constructor(
    @InjectRepository(WebhookEvent)
    private readonly webhookEventsRepository: Repository<WebhookEvent>,
    private readonly logger: LogService,
  ) {}

  async execute({
    event,
    payload,
  }: CreateWebhookEventUseCaseInput): Promise<WebhookEvent> {
    const webhookEvent = this.webhookEventsRepository.create({
      event,
      payload,
    });
    await this.webhookEventsRepository.save(webhookEvent);

    this.logger.log('Webhook event created', { id: webhookEvent.id, event });

    return webhookEvent;
  }
}
