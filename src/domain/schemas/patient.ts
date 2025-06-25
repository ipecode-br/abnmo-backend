import { z } from 'zod';

// Entity

// TODO: review enums for gender
export const genderEnum = z.enum([
  'male_cis',
  'female_cis',
  'male_trans',
  'female_trans',
  'non_binary',
  'prefer_not_to_say',
]);
export type GenderType = z.infer<typeof genderEnum>;

export const patientSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    gender: genderEnum.nullable(),
    date_of_birth: z.coerce.date(),
    phone: z.string(),
    cpf: z.string().min(11).max(11),
    state: z.string(),
    city: z.string(),
    // medical report
    has_disability: z.boolean().default(false),
    disability_desc: z.string().nullable(),
    need_legal_assistance: z.boolean().default(false),
    take_medication: z.boolean().default(false),
    medication_desc: z.string().nullable(),
    has_nmo_diagnosis: z.boolean().default(false),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type PatientSchema = z.infer<typeof patientSchema>;
