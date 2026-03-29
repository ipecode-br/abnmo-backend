import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { notificationRecipientSchema, notificationSchema } from '.';

export const notificationItemSchema = notificationSchema
  .pick({
    id: true,
    title: true,
    content: true,
    type: true,
    createdAt: true,
  })
  .extend({
    isRead: notificationRecipientSchema.shape.isRead,
    readAt: notificationRecipientSchema.shape.readAt,
  });
export type NotificationItem = z.infer<typeof notificationItemSchema>;

export const getNotificationsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    notifications: z.array(notificationItemSchema),
    total: z.number(),
  }),
});

export const getUnreadNotificationsCountResponseSchema =
  baseResponseSchema.extend({
    data: z.object({
      count: z.number(),
    }),
  });
