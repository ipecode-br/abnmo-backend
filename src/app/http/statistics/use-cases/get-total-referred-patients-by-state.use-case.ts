import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import type { TotalReferredPatientsByStateSchema } from '@/domain/schemas/statistics/responses';
import { UtilsService } from '@/utils/utils.service';

import type { GetReferredPatientsByStateQuery } from '../statistics.dtos';

interface GetTotalReferredPatientsByStateUseCaseInput {
  query: GetReferredPatientsByStateQuery;
}

interface GetTotalReferredPatientsByStateUseCaseOutput {
  states: TotalReferredPatientsByStateSchema[];
  total: number;
}

@Injectable()
export class GetTotalReferredPatientsByStateUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly utilsService: UtilsService,
  ) {}

  async execute({
    query,
  }: GetTotalReferredPatientsByStateUseCaseInput): Promise<GetTotalReferredPatientsByStateUseCaseOutput> {
    const { startDate, endDate } = this.utilsService.getDateRangeForPeriod(
      query.period,
    );

    const createQueryBuilder = (): SelectQueryBuilder<Patient> => {
      return this.patientsRepository
        .createQueryBuilder('patient')
        .innerJoin('patient.referrals', 'referral')
        .where('referral.id IS NOT NULL');
    };

    function getQueryBuilderWithFilters(
      queryBuilder: SelectQueryBuilder<Patient>,
    ) {
      if (startDate && endDate) {
        queryBuilder.andWhere('referral.created_at BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        });
      }

      return queryBuilder;
    }

    const stateListQuery = getQueryBuilderWithFilters(
      createQueryBuilder()
        .select('patient.state', 'state')
        .addSelect('COUNT(DISTINCT patient.id)', 'total')
        .groupBy('patient.state')
        .orderBy('COUNT(DISTINCT patient.id)', 'DESC')
        .limit(query.limit),
    );

    const totalStatesQuery = getQueryBuilderWithFilters(
      createQueryBuilder().select('COUNT(DISTINCT patient.state)', 'total'),
    );

    const [states, totalResult] = await Promise.all([
      stateListQuery.getRawMany<TotalReferredPatientsByStateSchema>(),
      totalStatesQuery.getRawOne<{ total: string }>(),
    ]);

    return {
      states,
      total: Number(totalResult?.total || 0),
    };
  }
}
