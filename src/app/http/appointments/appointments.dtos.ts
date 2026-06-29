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

export class CreateAppointmentBody extends createZodDto(
  createAppointmentSchema,
) {}

export class UpdateAppointmentBody extends createZodDto(
  updateAppointmentSchema,
) {}
