import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { NotificationRecipient } from '@/domain/entities/notification-recipient';
import type { NotificationRecipientType } from '@/domain/enums/notifications';

interface GetUnreadNotificationsCountUseCaseInput {
  recipientType: NotificationRecipientType;
  recipientId: string;
}

interface GetUnreadNotificationsCountUseCaseOutput {
  count: number;
}

@Injectable()
export class GetUnreadNotificationsCountUseCase {
  constructor(
    @InjectRepository(NotificationRecipient)
    private readonly recipientsRepository: Repository<NotificationRecipient>,
  ) {}

  async execute({
    recipientType,
    recipientId,
  }: GetUnreadNotificationsCountUseCaseInput): Promise<GetUnreadNotificationsCountUseCaseOutput> {
    const count = await this.recipientsRepository.count({
      where: { recipientType, recipientId, isRead: false },
    });

    return { count };
  }
}
