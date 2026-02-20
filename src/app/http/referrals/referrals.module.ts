import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Patient } from '@/domain/entities/patient';
import { Referral } from '@/domain/entities/referral';
import { User } from '@/domain/entities/user';

import { ReferralsController } from './referrals.controller';
import { CancelReferralUseCase } from './use-cases/cancel-referral.use-case';
import { CreateReferralUseCase } from './use-cases/create-referrals.use-case';
import { GetReferralsUseCase } from './use-cases/get-referrals.use-case';
import { UpdateReferralUseCase } from './use-cases/update-referral.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Referral, Patient, User])],
  controllers: [ReferralsController],
  providers: [
    GetReferralsUseCase,
    CreateReferralUseCase,
    UpdateReferralUseCase,
    CancelReferralUseCase,
  ],
})
export class ReferralsModule {}
