import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type FindOptionsWhere, Repository } from 'typeorm';

import { can } from '@/common/authorization/can';
import type { RequestUser } from '@/common/types';
import { WebhookEvent } from '@/domain/entities/webhook-event';
import type { QueryOrder } from '@/domain/enums/queries';
import type {
  WebhookEventsOrderBy,
  WebhookEventStatus,
  WebhookEventType,
} from '@/domain/enums/webhook-events';
import type { WebhookResponseSchema } from '@/domain/schemas/webhooks/responses';

interface GetWebhookEventsUseCaseInput {
  event?: WebhookEventType;
  order?: QueryOrder;
  orderBy?: WebhookEventsOrderBy;
  page: number;
  perPage: number;
  status?: WebhookEventStatus;
  user: RequestUser;
}

interface GetWebhookEventsUseCaseOutput {
  events: WebhookResponseSchema[];
  total: number;
}

@Injectable()
export class GetWebhookEventsUseCase {
  constructor(
    @InjectRepository(WebhookEvent)
    private readonly webhookEventsRepository: Repository<WebhookEvent>,
  ) {}

  async execute({
    page,
    event,
    perPage,
    status,
    user,
    ...props
  }: GetWebhookEventsUseCaseInput): Promise<GetWebhookEventsUseCaseOutput> {
    can(user, 'read:webhook');

    const ORDER_BY_MAPPING: Record<WebhookEventsOrderBy, keyof WebhookEvent> = {
      date: 'createdAt',
      event: 'event',
      status: 'status',
    };

    const orderBy = ORDER_BY_MAPPING[props.orderBy || 'date'];
    const order = props.order || 'DESC';

    const where: FindOptionsWhere<WebhookEvent> = {};

    if (event) {
      where.event = event;
    }

    if (status) {
      where.status = status;
    }

    const total = await this.webhookEventsRepository.count({ where });

    const events = await this.webhookEventsRepository.find({
      select: { id: true, event: true, status: true, createdAt: true },
      order: { [orderBy]: order },
      skip: (page - 1) * perPage,
      take: perPage,
      where,
    });

    return {
      events: events.map((event) => ({
        id: event.id,
        event: event.event,
        status: event.status,
        createdAt: event.createdAt,
      })),
      total,
    };
  }
}
