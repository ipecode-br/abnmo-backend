import { z } from 'zod';

import { NOTIFICATION_RECIPIENT_TYPES } from '@/domain/enums/notifications';

import { queryLimitSchema, queryPageSchema } from '../query';
import { notificationSchema } from '.';

export const createNotificationSchema = notificationSchema
  .pick({
    title: true,
    content: true,
  })
  .extend({
    type: notificationSchema.shape.type.optional(),
    sendToAllUsers: z.boolean().optional(),
    sendToAllPatients: z.boolean().optional(),
    targetUsersIds: z.array(z.string().uuid()).optional(),
    targetPatientsIds: z.array(z.string().uuid()).optional(),
  });

export const getNotificationsQuerySchema = z.object({
  recipientType: z.enum(NOTIFICATION_RECIPIENT_TYPES).optional(),
  page: queryPageSchema,
  limit: queryLimitSchema,
});
