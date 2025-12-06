import { createZodDto } from 'nestjs-zod';

import { createReferralSchema } from '@/domain/schemas/referral';

export class CreateReferralDto extends createZodDto(createReferralSchema) {}
