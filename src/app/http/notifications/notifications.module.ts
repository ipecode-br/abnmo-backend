import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Notification } from '@/domain/entities/notification';
import { NotificationRecipient } from '@/domain/entities/notification-recipient';
import { Patient } from '@/domain/entities/patient';
import { User } from '@/domain/entities/user';

import { NotificationsController } from './notifications.controller';
import { CreateNotificationUseCase } from './use-cases/create-notification.use-case';
import { GetNotificationsUseCase } from './use-cases/get-notifications.use-case';
import { GetUnreadNotificationsCountUseCase } from './use-cases/get-unread-notifications-count.use-case';
import { MarkAllNotificationsAsReadUseCase } from './use-cases/mark-all-notifications-as-read.use-case';
import { MarkNotificationAsReadUseCase } from './use-cases/mark-notification-as-read.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationRecipient,
      User,
      Patient,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    CreateNotificationUseCase,
    GetNotificationsUseCase,
    GetUnreadNotificationsCountUseCase,
    MarkNotificationAsReadUseCase,
    MarkAllNotificationsAsReadUseCase,
  ],
  exports: [CreateNotificationUseCase],
})
export class NotificationsModule {}
