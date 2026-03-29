import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import {
  NOTIFICATION_RECIPIENT_TYPES,
  type NotificationRecipientType,
} from '../enums/notifications';
import type { NotificationRecipientSchema } from '../schemas/notifications';
import { Notification } from './notification';

@Entity('notification_recipients')
@Index(['recipientType', 'recipientId'])
@Index(['recipientType', 'recipientId', 'isRead'])
export class NotificationRecipient implements NotificationRecipientSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  notificationId: string;

  @Column({ type: 'enum', enum: NOTIFICATION_RECIPIENT_TYPES })
  recipientType: NotificationRecipientType;

  @Column({ type: 'uuid' })
  recipientId: string;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  isRead: boolean;

  @Column({ type: 'datetime', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @ManyToOne(() => Notification, (notification) => notification.recipients)
  @JoinColumn()
  notification: Notification;
}
