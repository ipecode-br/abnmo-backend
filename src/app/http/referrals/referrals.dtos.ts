import { createZodDto } from 'nestjs-zod';

import {
  createReferralSchema,
  getReferralsQuerySchema,
  updateReferralSchema,
} from '@/domain/schemas/referrals/requests';
import { getReferralsResponseSchema } from '@/domain/schemas/referrals/responses';

export class GetReferralsQuery extends createZodDto(getReferralsQuerySchema) {}
export class GetReferralsResponse extends createZodDto(
  getReferralsResponseSchema,
) {}

export class CreateReferralDto extends createZodDto(createReferralSchema) {}

export class UpdateReferralDto extends createZodDto(updateReferralSchema) {}
