import { z } from 'zod';

import { ONLY_NUMBERS_REGEX } from '@/constants/regex';

import { PATIENT_CONDITIONS } from '../enums/patients';
import { SPECIALTY_CATEGORIES } from '../enums/shared';
import { KINSHIP_TYPES } from '../enums/surveys';
import { USER_ROLES } from '../enums/users';

export const uuidSchema = z.uuid({ version: 'v7' });

export const nameSchema = z.string().min(3).max(64);

// Maximum email length is 254 characters.
export const emailSchema = z.email().min(1).max(254);

export const passwordSchema = z.string().min(8).max(64);

export const userRoleSchema = z.enum(USER_ROLES);

export const userRegistrationIdSchema = z.string().max(32);

export const dateSchema = z.iso.date();

export const datetimeSchema = (() => {
  const schema = z.codec(
    // input schema: ISO date string or Date object
    z.union([z.iso.datetime(), z.date()]),
    // output schema: Date object
    z.date(),
    {
      // ISO string → Date
      decode: (isoString) => new Date(isoString),
      // Date → ISO string
      encode: (date) => date.toISOString(),
    },
  );
  schema._zod.processJSONSchema = (
    _ctx: unknown,
    json: Record<string, string>,
  ) => {
    json.type = 'string';
    json.format = 'date-time';
  };
  return schema;
})();

export const cpfSchema = z
  .string()
  .max(11)
  .length(11)
  .regex(ONLY_NUMBERS_REGEX, 'Only numbers are accepted');

export const susIdSchema = z
  .string()
  .max(15)
  .regex(ONLY_NUMBERS_REGEX, 'Only numbers are accepted');

export const phoneSchema = z
  .string()
  .min(10)
  .max(11)
  .regex(ONLY_NUMBERS_REGEX, 'Only numbers are accepted');

export const cepSchema = z
  .string()
  .max(8)
  .length(8)
  .regex(ONLY_NUMBERS_REGEX, 'Only numbers are accepted');

export const supportContactSchema = z.object({
  name: nameSchema,
  kinship: z.enum(KINSHIP_TYPES),
  phone: phoneSchema,
});
export type SupportContact = z.infer<typeof supportContactSchema>;

export const patientConditionSchema = z.enum(PATIENT_CONDITIONS);

export const specialtySchema = z.enum(SPECIALTY_CATEGORIES);
