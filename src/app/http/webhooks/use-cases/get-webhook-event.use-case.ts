import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { can } from '@/common/authorization/can';
import type { RequestUser } from '@/common/types';
import { WebhookEvent } from '@/domain/entities/webhook-event';
import type { WebhookEventDetailsResponse } from '@/domain/schemas/webhooks/responses';

interface GetWebhookEventUseCaseInput {
  id: string;
  user: RequestUser;
}

@Injectable()
export class GetWebhookEventUseCase {
  constructor(
    @InjectRepository(WebhookEvent)
    private readonly webhookEventsRepository: Repository<WebhookEvent>,
  ) {}

  async execute({
    id,
    user,
  }: GetWebhookEventUseCaseInput): Promise<WebhookEventDetailsResponse> {
    can(user, 'read:webhook');

    const webhookEvent = await this.webhookEventsRepository.findOne({
      where: { id },
      select: {
        id: true,
        event: true,
        status: true,
        payload: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    if (!webhookEvent) {
      throw new NotFoundException('Evento de webhook não encontrado.', {
        cause: `Webhook event with ID <${id}> not found`,
      });
    }

    return {
      id: webhookEvent.id,
      event: webhookEvent.event,
      status: webhookEvent.status,
      payload: webhookEvent.payload,
      updatedAt: webhookEvent.updatedAt,
      createdAt: webhookEvent.createdAt,
    };
  }
}
