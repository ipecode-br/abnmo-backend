import { Injectable } from '@nestjs/common';

import type { GetTotalReferralsAndReferredPatientsPercentageQuery } from '../statistics.dtos';
import { GetTotalPatientsUseCase } from './get-total-patients.use-case';
import { GetTotalReferralsUseCase } from './get-total-referrals.use-case';
import { GetTotalReferredPatientsUseCase } from './get-total-referred-patients.use-case';

interface GetTotalReferralsAndReferredPatientsPercentageUseCaseRequest {
  query: GetTotalReferralsAndReferredPatientsPercentageQuery;
}

type GetTotalReferralsAndReferredPatientsPercentageUseCaseResponse = Promise<{
  totalReferrals: number;
  referredPatientsPercentage: number;
}>;

@Injectable()
export class GetTotalReferralsAndReferredPatientsPercentageUseCase {
  constructor(
    private readonly getTotalPatientsUseCase: GetTotalPatientsUseCase,
    private readonly getTotalReferralsUseCase: GetTotalReferralsUseCase,
    private readonly getTotalReferredPatientsUseCase: GetTotalReferredPatientsUseCase,
  ) {}

  async execute({
    query,
  }: GetTotalReferralsAndReferredPatientsPercentageUseCaseRequest): GetTotalReferralsAndReferredPatientsPercentageUseCaseResponse {
    const { period } = query;

    const [totalPatients, totalReferrals, totalReferredPatients] =
      await Promise.all([
        this.getTotalPatientsUseCase.execute({ period }),
        this.getTotalReferralsUseCase.execute({ period }),
        this.getTotalReferredPatientsUseCase.execute({ period }),
      ]);

    const percentage = Number((totalReferredPatients / totalPatients) * 100);

    return {
      totalReferrals,
      referredPatientsPercentage: Number(percentage.toFixed(2)),
    };
  }
}
