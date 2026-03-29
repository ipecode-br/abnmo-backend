import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, type Repository } from 'typeorm';

import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
import { Notification } from '@/domain/entities/notification';
import { NotificationRecipient } from '@/domain/entities/notification-recipient';
import { Patient } from '@/domain/entities/patient';
import { User } from '@/domain/entities/user';
import type {
  NotificationRecipientType,
  NotificationType,
} from '@/domain/enums/notifications';

interface CreateNotificationUseCaseInput {
  title: string;
  content: string;
  type?: NotificationType;
  createdByUserId: string;
  sendToAllUsers?: boolean;
  sendToAllPatients?: boolean;
  targetUsersIds?: string[];
  targetPatientsIds?: string[];
}

interface CreateNotificationUseCaseOutput {
  notificationId: string;
}

@Logger()
@Injectable()
export class CreateNotificationUseCase {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(NotificationRecipient)
    private readonly recipientsRepository: Repository<NotificationRecipient>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {}

  async execute(
    input: CreateNotificationUseCaseInput,
  ): Promise<CreateNotificationUseCaseOutput> {
    this.logger.setEvent('create_notification');

    const hasTargets =
      input.sendToAllUsers ||
      input.sendToAllPatients ||
      (input.targetUsersIds && input.targetUsersIds.length > 0) ||
      (input.targetPatientsIds && input.targetPatientsIds.length > 0);

    if (!hasTargets) {
      throw new BadRequestException(
        'É necessário informar ao menos um destinatário.',
      );
    }

    const recipientEntries: Array<{
      recipientType: NotificationRecipientType;
      recipientId: string;
    }> = [];

    if (input.sendToAllUsers) {
      const users = await this.usersRepository.find({
        select: { id: true },
      });
      for (const user of users) {
        recipientEntries.push({ recipientType: 'user', recipientId: user.id });
      }
    } else if (input.targetUsersIds && input.targetUsersIds.length > 0) {
      for (const id of input.targetUsersIds) {
        recipientEntries.push({ recipientType: 'user', recipientId: id });
      }
    }

    if (input.sendToAllPatients) {
      const patients = await this.patientsRepository.find({
        select: { id: true },
      });
      for (const patient of patients) {
        recipientEntries.push({
          recipientType: 'patient',
          recipientId: patient.id,
        });
      }
    } else if (input.targetPatientsIds && input.targetPatientsIds.length > 0) {
      for (const id of input.targetPatientsIds) {
        recipientEntries.push({ recipientType: 'patient', recipientId: id });
      }
    }

    let notificationId: string;

    await this.dataSource.transaction(async (manager) => {
      const notificationsDataSource = manager.getRepository(Notification);
      const recipientsDataSource = manager.getRepository(NotificationRecipient);

      const notification = notificationsDataSource.create({
        title: input.title,
        content: input.content,
        type: input.type ?? null,
        createdBy: input.createdByUserId,
      });

      await notificationsDataSource.save(notification);
      notificationId = notification.id;

      if (recipientEntries.length > 0) {
        await recipientsDataSource.insert(
          recipientEntries.map((entry) => ({
            notificationId: notification.id,
            recipientType: entry.recipientType,
            recipientId: entry.recipientId,
            isRead: false,
            readAt: null,
          })),
        );
      }
    });

    this.logger.log('Notification created successfully', {
      notificationId: notificationId!,
      createdBy: input.createdByUserId,
      recipientCount: recipientEntries.length,
    });

    return { notificationId: notificationId! };
  }
}
