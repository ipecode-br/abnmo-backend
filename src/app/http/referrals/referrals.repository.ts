import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { Referral } from '@/domain/entities/referral';
import { GetReferralsTotalResponseSchema } from '@/domain/schemas/statistics';

import { PatientsRepository } from '../patients/patients.repository';
import { GetReferralsTotalDto } from '../statistics/statistics.dtos';

@Injectable()
export class ReferralsRepository {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
    private readonly patientsRepository: PatientsRepository,
  ) {}

  async getReferralsTotal(
    filters: GetReferralsTotalDto,
  ): Promise<GetReferralsTotalResponseSchema['data']> {
    const { period } = filters;

    const queryReferralsTotal = this.referralsRepository
      .createQueryBuilder('referral')
      .leftJoinAndSelect('referral.patient', 'patient')
      .where("patient.status <> 'pending'");

    const queryPatientsNonPending = this.referralsRepository
      .createQueryBuilder('referral')
      .leftJoin('referral.patient', 'patient')
      .select('COUNT(DISTINCT patient.id)', 'count')
      .where("patient.status <> 'pending'");

    this.applyPeriodFilter(queryReferralsTotal, period);
    this.applyPeriodFilter(queryPatientsNonPending, period);

    const [totalReferrals, uniquePatientsResult] = await Promise.all([
      queryReferralsTotal.getCount(),
      queryPatientsNonPending.getRawOne<{ count: string }>(),
    ]);

    const patientsPerReferrals = uniquePatientsResult
      ? Number(uniquePatientsResult.count)
      : 0;

    const totalPatients = (await this.patientsRepository.getPatientsTotal())
      .total;

    const percentage = Math.round((patientsPerReferrals / totalPatients) * 100);

    return {
      total: totalReferrals,
      percentage: percentage,
    };
  }

  private applyPeriodFilter(
    queryBuilder: SelectQueryBuilder<Referral>,
    period: string,
  ): void {
    if (period === 'last-year') {
      queryBuilder
        .andWhere(
          "referral.date >= DATE_FORMAT(CURRENT_DATE - INTERVAL 1 YEAR, '%Y-01-01')",
        )
        .andWhere("referral.date < DATE_FORMAT(CURRENT_DATE, '%Y-01-01')");
    }
    if (period === 'last-month') {
      queryBuilder
        .andWhere(
          "referral.date >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') - INTERVAL 1 MONTH",
        )
        .andWhere("referral.date < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')");
    }
    if (period === 'last-week') {
      queryBuilder
        .andWhere(
          'referral.date >= DATE_SUB(DATE_SUB(CURRENT_DATE, INTERVAL WEEKDAY(CURRENT_DATE) DAY), INTERVAL 1 WEEK)',
        )
        .andWhere(
          'referral.date < DATE_SUB(CURRENT_DATE, INTERVAL WEEKDAY(CURRENT_DATE) DAY)',
        );
    }
    if (period === 'today') {
      queryBuilder.andWhere('referral.date = CURDATE()');
    }
  }
}
