import { z } from 'zod';

import { BRAZILIAN_STATES } from '@/constants/brazilian-states';
import { PATIENT_GENDERS, PATIENT_STATUSES } from '@/domain/enums/patients';

import {
  avatarSchema,
  emailSchema,
  nameSchema,
  passwordSchema,
  phoneSchema,
} from '../shared';

export const patientSchema = z
  .object({
    id: z.string().uuid(),
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema.nullable(),
    avatar_url: avatarSchema.nullable(),
    status: z.enum(PATIENT_STATUSES).default('pending'),
    gender: z.enum(PATIENT_GENDERS).default('prefer_not_to_say'),
    date_of_birth: z.coerce.date().nullable(),
    phone: phoneSchema.nullable(),
    cpf: z.string().max(11).nullable(),
    state: z.enum(BRAZILIAN_STATES).nullable(),
    city: z.string().nullable(),
    // medical report
    has_disability: z.boolean().default(false),
    disability_desc: z.string().max(500).nullable(),
    need_legal_assistance: z.boolean().default(false),
    take_medication: z.boolean().default(false),
    medication_desc: z.string().max(500).nullable(),
    has_nmo_diagnosis: z.boolean().default(false),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type PatientSchema = z.infer<typeof patientSchema>;
