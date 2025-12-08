import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import type { StateReferredPatients } from '@/domain/schemas/statistics';
import { UtilsService } from '@/utils/utils.service';

import type { GetReferredPatientsByStateQuery } from '../statistics.dtos';

interface GetReferredPatientsByStateUseCaseRequest {
  query: GetReferredPatientsByStateQuery;
}

type GetReferredPatientsByStateUseCaseResponse = Promise<{
  states: StateReferredPatients[];
  total: number;
}>;

@Injectable()
export class GetReferredPatientsByStateUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly utilsService: UtilsService,
  ) {}

  async execute({
    query,
  }: GetReferredPatientsByStateUseCaseRequest): GetReferredPatientsByStateUseCaseResponse {
    const { startDate, endDate } = this.utilsService.getDateRangeForPeriod(
      query.period,
    );

    const createQueryBuilder = (): SelectQueryBuilder<Patient> => {
      return this.patientsRepository
        .createQueryBuilder('patient')
        .innerJoin('patient.referrals', 'referral')
        .where('referral.referred_to IS NOT NULL')
        .andWhere('referral.referred_to != :empty', { empty: '' });
    };

    function getQueryBuilderWithFilters(
      queryBuilder: SelectQueryBuilder<Patient>,
    ) {
      if (startDate && endDate) {
        queryBuilder.andWhere('referral.date BETWEEN :start AND :end', {
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
      stateListQuery.getRawMany<StateReferredPatients>(),
      totalStatesQuery.getRawOne<{ total: string }>(),
    ]);

    return {
      states,
      total: Number(totalResult?.total || 0),
    };
  }
}
