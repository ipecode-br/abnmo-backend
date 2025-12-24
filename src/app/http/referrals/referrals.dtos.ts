import { createZodDto } from 'nestjs-zod';

import {
  createReferralSchema,
  getReferralsQuerySchema,
} from '@/domain/schemas/referrals/requests';

export class CreateReferralDto extends createZodDto(createReferralSchema) {}

export class GetReferralsQuery extends createZodDto(getReferralsQuerySchema) {}
