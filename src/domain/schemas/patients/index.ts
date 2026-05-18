import { z } from 'zod';

import { BRAZILIAN_STATES } from '@/constants/brazilian-states';
import {
  PATIENT_GENDERS,
  PATIENT_NMO_DIAGNOSTICS,
  PATIENT_RACES,
  PATIENT_STATUSES,
} from '@/domain/enums/patients';

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
    avatarUrl: avatarSchema.nullable(),
    status: z.enum(PATIENT_STATUSES).default('pending'),
    gender: z.enum(PATIENT_GENDERS).default('prefer_not_to_say'),
    race: z.enum(PATIENT_RACES).default('prefer_not_to_say'),
    dateOfBirth: z.coerce.date(),
    phone: phoneSchema,
    cpf: z.string().max(11),
    state: z.enum(BRAZILIAN_STATES),
    city: z.string().max(64),
    // medical report
    hasDisability: z.boolean().default(false),
    disabilityDesc: z.string().max(500).nullable(),
    needLegalAssistance: z.boolean().default(false),
    takeMedication: z.boolean().default(false),
    medicationDesc: z.string().max(500).nullable(),
    nmoDiagnosis: z.enum(PATIENT_NMO_DIAGNOSTICS),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strict();
export type PatientSchema = z.infer<typeof patientSchema>;
