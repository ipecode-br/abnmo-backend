import { createZodDto } from 'nestjs-zod';

import {
  appointmentSchema,
  updateAppointmentSchema,
} from '@/domain/schemas/appointment';

export class CreateAppointmentDto extends createZodDto(appointmentSchema) {}
export class UpdateAppointmentDto extends createZodDto(
  updateAppointmentSchema,
) {}
