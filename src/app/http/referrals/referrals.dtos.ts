import { createZodDto } from 'nestjs-zod';

import {
  createReferralSchema,
  getReferralsQuerySchema,
} from '@/domain/schemas/referral/requests';

export class CreateReferralDto extends createZodDto(createReferralSchema) {}

export class GetReferralsQuery extends createZodDto(getReferralsQuerySchema) {}
