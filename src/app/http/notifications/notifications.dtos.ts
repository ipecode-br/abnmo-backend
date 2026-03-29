import { createZodDto } from 'nestjs-zod';

import {
  createNotificationSchema,
  getNotificationsQuerySchema,
} from '@/domain/schemas/notifications/requests';
import {
  getNotificationsResponseSchema,
  getUnreadNotificationsCountResponseSchema,
} from '@/domain/schemas/notifications/responses';

export class GetNotificationsQuery extends createZodDto(
  getNotificationsQuerySchema,
) {}
export class GetNotificationsResponse extends createZodDto(
  getNotificationsResponseSchema,
) {}
export class GetUnreadNotificationsCountResponse extends createZodDto(
  getUnreadNotificationsCountResponseSchema,
) {}
export class CreateNotificationDto extends createZodDto(
  createNotificationSchema,
) {}
