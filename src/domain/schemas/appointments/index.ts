import { z } from 'zod';

import { APPOINTMENT_STATUSES } from '@/domain/enums/appointments';

import { nameSchema, patientConditionSchema, specialtySchema } from '../shared';

export const appointmentSchema = z
  .object({
    id: z.string().uuid(),
    patientId: z.string().uuid(),
    date: z.coerce.date(),
    status: z.enum(APPOINTMENT_STATUSES).default('scheduled'),
    category: specialtySchema,
    condition: patientConditionSchema,
    annotation: z.string().max(500).nullable(),
    professionalName: nameSchema.nullable(),
    userId: z.string().uuid().nullable(),
    createdBy: z.string().uuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strict();
export type AppointmentSchema = z.infer<typeof appointmentSchema>;
