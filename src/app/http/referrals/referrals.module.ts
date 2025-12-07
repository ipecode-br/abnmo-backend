import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Patient } from '@/domain/entities/patient';
import { Referral } from '@/domain/entities/referral';

import { ReferralsController } from './referrals.controller';
import { ReferralsRepository } from './referrals.repository';
import { CancelReferralUseCase } from './use-cases/cancel-referral-use-case';
import { CreateReferralUseCase } from './use-cases/create-referrals-use-case';
import { GetReferralsUseCase } from './use-cases/get-referrals-use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([Referral]),
    TypeOrmModule.forFeature([Patient]),
  ],
  controllers: [ReferralsController],
  providers: [
    ReferralsRepository,
    GetReferralsUseCase,
    CreateReferralUseCase,
    CancelReferralUseCase,
  ],
  exports: [ReferralsRepository],
})
export class ReferralsModule {}
