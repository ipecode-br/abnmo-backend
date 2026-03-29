import { z } from 'zod';

import {
  NOTIFICATION_RECIPIENT_TYPES,
  NOTIFICATION_TYPES,
} from '@/domain/enums/notifications';

export const notificationSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().min(1).max(255),
    content: z.string().min(1),
    type: z.enum(NOTIFICATION_TYPES).nullable(),
    createdBy: z.string().uuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strict();
export type NotificationSchema = z.infer<typeof notificationSchema>;

export const notificationRecipientSchema = z
  .object({
    id: z.string().uuid(),
    notificationId: z.string().uuid(),
    recipientType: z.enum(NOTIFICATION_RECIPIENT_TYPES),
    recipientId: z.string().uuid(),
    isRead: z.boolean().default(false),
    readAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
  })
  .strict();
export type NotificationRecipientSchema = z.infer<
  typeof notificationRecipientSchema
>;
