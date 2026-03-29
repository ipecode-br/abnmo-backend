import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
import { NotificationRecipient } from '@/domain/entities/notification-recipient';
import type { NotificationRecipientType } from '@/domain/enums/notifications';

interface MarkNotificationAsReadUseCaseInput {
  recipientType: NotificationRecipientType;
  recipientId: string;
  notificationId: string;
}

@Logger()
@Injectable()
export class MarkNotificationAsReadUseCase {
  constructor(
    @InjectRepository(NotificationRecipient)
    private readonly recipientsRepository: Repository<NotificationRecipient>,
    private readonly logger: AppLogger,
  ) {}

  async execute({
    recipientType,
    recipientId,
    notificationId,
  }: MarkNotificationAsReadUseCaseInput): Promise<void> {
    this.logger.setEvent('mark_notification_as_read');

    const recipient = await this.recipientsRepository.findOne({
      select: { id: true, isRead: true },
      where: { notificationId, recipientType, recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('Notificação não encontrada.');
    }

    if (recipient.isRead) {
      return;
    }

    await this.recipientsRepository.update(
      { id: recipient.id },
      { isRead: true, readAt: new Date() },
    );

    this.logger.log('Notification marked as read', {
      notificationId,
      recipientId,
      recipientType,
    });
  }
}
