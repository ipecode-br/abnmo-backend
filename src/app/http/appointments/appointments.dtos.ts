import { createZodDto } from 'nestjs-zod';

import {
  createAppointmentSchema,
  updateAppointmentSchema,
} from '@/domain/schemas/appointment';

export class CreateAppointmentDto extends createZodDto(
  createAppointmentSchema,
) {}
export class UpdateAppointmentDto extends createZodDto(
  updateAppointmentSchema,
) {}
