import { z } from 'zod';

import { ONLY_NUMBERS_REGEX } from '@/constants/regex';

import { PATIENT_CONDITIONS } from '../enums/patients';
import { SPECIALTY_CATEGORIES } from '../enums/shared';
import { USER_ROLES } from '../enums/users';

export const nameSchema = z.string().min(3).max(64);

export const emailSchema = z.string().min(1).max(64).email();

export const passwordSchema = z.string().min(8).max(64);

export const userRoleSchema = z.enum(USER_ROLES);

export const userRegistrationId = z.string().max(32);

export const avatarSchema = z.string().url();

export const phoneSchema = z
  .string()
  .min(10)
  .max(11)
  .regex(ONLY_NUMBERS_REGEX, 'Only numbers are accepted');

export const patientConditionSchema = z.enum(PATIENT_CONDITIONS);

export const specialtySchema = z.enum(SPECIALTY_CATEGORIES);
