import { createZodDto } from 'nestjs-zod';

import {
  createAppointmentSchema,
  getAppointmentsQuerySchema,
  updateAppointmentSchema,
} from '@/domain/schemas/appointments/requests';

export class CreateAppointmentDto extends createZodDto(
  createAppointmentSchema,
) {}

export class UpdateAppointmentDto extends createZodDto(
  updateAppointmentSchema,
) {}

export class GetAppointmentsQuery extends createZodDto(
  getAppointmentsQuerySchema,
) {}
