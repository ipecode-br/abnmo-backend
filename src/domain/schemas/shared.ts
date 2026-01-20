import { z } from 'zod';

import { ONLY_NUMBERS_REGEX } from '@/constants/regex';

export const nameSchema = z.string().min(3).max(64);

export const emailSchema = z.string().min(3).max(64);

export const passwordSchema = z.string().min(8).max(64);

export const avatarSchema = z.string().url();

export const phoneSchema = z
  .string()
  .min(10)
  .max(11)
  .regex(ONLY_NUMBERS_REGEX, 'Only numbers are accepted');
