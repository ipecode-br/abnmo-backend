import { z } from 'zod';

import { APPOINTMENT_STATUSES } from '@/domain/enums/appointments';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/specialties';

import { PATIENT_CONDITIONS } from '../patient';

export const appointmentSchema = z
  .object({
    id: z.string().uuid(),
    patient_id: z.string().uuid(),
    date: z.coerce.date(),
    status: z.enum(APPOINTMENT_STATUSES).default('scheduled'),
    category: z.enum(SPECIALTY_CATEGORIES),
    condition: z.enum(PATIENT_CONDITIONS),
    annotation: z.string().max(500).nullable(),
    professional_name: z.string().max(255).nullable(),
    created_by: z.string().uuid(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type AppointmentSchema = z.infer<typeof appointmentSchema>;
