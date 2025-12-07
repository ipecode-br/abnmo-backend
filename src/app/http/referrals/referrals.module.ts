import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Referral } from '@/domain/entities/referral';

import { PatientsModule } from '../patients/patients.module';
import { ReferralsController } from './referrals.controller';
import { ReferralsRepository } from './referrals.repository';
import { ReferralsService } from './referrals.service';
import { GetReferralsUseCase } from './use-cases/get-referrals-use-case';

@Module({
  imports: [PatientsModule, TypeOrmModule.forFeature([Referral])],
  controllers: [ReferralsController],
  providers: [ReferralsService, ReferralsRepository, GetReferralsUseCase],
  exports: [ReferralsService, ReferralsRepository],
})
export class ReferralsModule {}
