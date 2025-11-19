import { createZodDto } from 'nestjs-zod';

import { createReferralSchema } from '@/domain/schemas/referral';

export class CreateReferralsDto extends createZodDto(createReferralSchema) {}
