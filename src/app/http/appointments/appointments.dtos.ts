import { createZodDto } from 'nestjs-zod';

import {
  createAppointmentSchema,
  getAppointmentsQuerySchema,
  updateAppointmentSchema,
} from '@/domain/schemas/appointments/requests';
import { getAppointmentsResponseSchema } from '@/domain/schemas/appointments/responses';

export class GetAppointmentsQuery extends createZodDto(
  getAppointmentsQuerySchema,
) {}
export class GetAppointmentsResponse extends createZodDto(
  getAppointmentsResponseSchema,
) {}

export class CreateAppointmentDto extends createZodDto(
  createAppointmentSchema,
) {}

export class UpdateAppointmentDto extends createZodDto(
  updateAppointmentSchema,
) {}
