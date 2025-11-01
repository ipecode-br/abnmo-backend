import { createZodDto } from 'nestjs-zod';

import {
  createAppointmentSchema,
  findAllAppointmentsQuerySchema,
  updateAppointmentSchema,
} from '@/domain/schemas/appointment';

export class CreateAppointmentDto extends createZodDto(
  createAppointmentSchema,
) {}
export class UpdateAppointmentDto extends createZodDto(
  updateAppointmentSchema,
) {}

export class FindAllAppointmentsQueryDto extends createZodDto(
  findAllAppointmentsQuerySchema,
) {}
