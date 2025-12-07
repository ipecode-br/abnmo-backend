import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Patient } from '@/domain/entities/patient';
import { Referral } from '@/domain/entities/referral';

import { PatientsModule } from '../patients/patients.module';
import { ReferralsController } from './referrals.controller';
import { ReferralsRepository } from './referrals.repository';
import { ReferralsService } from './referrals.service';
import { CreateReferralUseCase } from './use-cases/create-referrals-use-case';
import { GetReferralsUseCase } from './use-cases/get-referrals-use-case';

@Module({
  imports: [
    PatientsModule,
    TypeOrmModule.forFeature([Referral]),
    TypeOrmModule.forFeature([Patient]),
  ],
  controllers: [ReferralsController],
  providers: [
    ReferralsService,
    ReferralsRepository,
    GetReferralsUseCase,
    CreateReferralUseCase,
  ],
  exports: [ReferralsService, ReferralsRepository],
})
export class ReferralsModule {}
