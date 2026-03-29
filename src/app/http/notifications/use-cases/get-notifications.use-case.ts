import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { NotificationRecipient } from '@/domain/entities/notification-recipient';
import type { NotificationRecipientType } from '@/domain/enums/notifications';
import type { NotificationItem } from '@/domain/schemas/notifications/responses';

interface GetNotificationsUseCaseInput {
  recipientType: NotificationRecipientType;
  recipientId: string;
  page: number;
  limit: number;
}

interface GetNotificationsUseCaseOutput {
  notifications: NotificationItem[];
  total: number;
}

@Injectable()
export class GetNotificationsUseCase {
  constructor(
    @InjectRepository(NotificationRecipient)
    private readonly recipientsRepository: Repository<NotificationRecipient>,
  ) {}

  async execute({
    recipientType,
    recipientId,
    page,
    limit,
  }: GetNotificationsUseCaseInput): Promise<GetNotificationsUseCaseOutput> {
    const where = { recipientType, recipientId };

    const total = await this.recipientsRepository.count({ where });

    const recipients = await this.recipientsRepository.find({
      select: {
        isRead: true,
        readAt: true,
        notification: {
          id: true,
          title: true,
          content: true,
          type: true,
          createdAt: true,
        },
      },
      relations: { notification: true },
      where,
      order: { notification: { createdAt: 'DESC' } },
      skip: (page - 1) * limit,
      take: limit,
    });

    const notifications: NotificationItem[] = recipients.map((r) => ({
      id: r.notification.id,
      title: r.notification.title,
      content: r.notification.content,
      type: r.notification.type,
      createdAt: r.notification.createdAt,
      isRead: r.isRead,
      readAt: r.readAt,
    }));

    return { notifications, total };
  }
}
