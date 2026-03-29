import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
import { NotificationRecipient } from '@/domain/entities/notification-recipient';
import type { NotificationRecipientType } from '@/domain/enums/notifications';

interface MarkAllNotificationsAsReadUseCaseInput {
  recipientType: NotificationRecipientType;
  recipientId: string;
}

@Logger()
@Injectable()
export class MarkAllNotificationsAsReadUseCase {
  constructor(
    @InjectRepository(NotificationRecipient)
    private readonly recipientsRepository: Repository<NotificationRecipient>,
    private readonly logger: AppLogger,
  ) {}

  async execute({
    recipientType,
    recipientId,
  }: MarkAllNotificationsAsReadUseCaseInput): Promise<void> {
    this.logger.setEvent('mark_all_notifications_as_read');

    await this.recipientsRepository.update(
      { recipientType, recipientId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    this.logger.log('All notifications marked as read', {
      recipientId,
      recipientType,
    });
  }
}
