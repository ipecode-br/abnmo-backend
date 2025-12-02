import { createZodDto } from 'nestjs-zod';

import {
  createReferralSchema,
  getReferralByPeriodSchema,
} from '@/domain/schemas/referral';

export class CreateReferralDto extends createZodDto(createReferralSchema) {}

export class GetReferralByPeriodDto extends createZodDto(
  getReferralByPeriodSchema,
) {}
