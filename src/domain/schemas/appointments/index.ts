import { z } from 'zod';

import { APPOINTMENT_STATUSES } from '@/domain/enums/appointments';

import { baseEntitySchema } from '../base';
import {
  nameSchema,
  patientConditionSchema,
  specialtySchema,
  uuidSchema,
} from '../shared';

export const appointmentSchema = z.strictObject({
  ...baseEntitySchema.shape,
  date: z.date(),
  status: z.enum(APPOINTMENT_STATUSES).default('scheduled'),
  category: specialtySchema,
  condition: patientConditionSchema,
  annotation: z.string().max(500).nullable(),
  professionalName: nameSchema.nullable(),
  createdBy: uuidSchema,
});
export type AppointmentSchema = z.infer<typeof appointmentSchema>;
