import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import type { QueryOrder, QueryPeriod } from '@/domain/enums/queries';
import type { PatientsStatisticField } from '@/domain/enums/statistics';
import { UtilsService } from '@/utils/utils.service';

import { GetTotalPatientsUseCase } from './get-total-patients.use-case';

interface GetTotalPatientsByFieldUseCaseInput {
  field: PatientsStatisticField;
  period?: QueryPeriod;
  startDate?: Date;
  endDate?: Date;
  order?: QueryOrder;
  limit?: number;
  withPercentage?: boolean;
}

interface GetTotalPatientsByFieldUseCaseOutput<T> {
  items: T[];
  total: number;
}

@Injectable()
export class GetTotalPatientsByFieldUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly getTotalPatientsUseCase: GetTotalPatientsUseCase,
    private readonly utilsService: UtilsService,
  ) {}

  async execute<T>({
    field,
    period,
    startDate,
    endDate,
    order,
    limit,
    withPercentage,
  }: GetTotalPatientsByFieldUseCaseInput): Promise<
    GetTotalPatientsByFieldUseCaseOutput<T>
  > {
    const dateRange = period
      ? this.utilsService.getDateRangeForPeriod(period)
      : { startDate, endDate };

    const totalPatients = await this.getTotalPatientsUseCase.execute({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });

    const createBaseQuery = (): SelectQueryBuilder<Patient> => {
      const baseQuery = this.patientsRepository
        .createQueryBuilder('patient')
        .where('patient.status != :status', { status: 'pending' });

      if (dateRange.startDate && dateRange.endDate) {
        baseQuery.andWhere('patient.created_at BETWEEN :start AND :end', {
          start: dateRange.startDate,
          end: dateRange.endDate,
        });
      }

      return baseQuery;
    };

    const totalQuery = createBaseQuery().select(
      `COUNT(DISTINCT patient.${field})`,
      'total',
    );

    const fieldQuery = createBaseQuery()
      .select(`patient.${field}`, field)
      .addSelect('COUNT(patient.id)', 'total')
      .groupBy(`patient.${field}`)
      .orderBy('total', order);

    if (withPercentage) {
      fieldQuery.addSelect(
        `ROUND((COUNT(patient.id) * 100.0 / ${totalPatients}), 1)`,
        'percentage',
      );
    }

    const [items, totalResult] = await Promise.all([
      fieldQuery.getRawMany<T>(),
      totalQuery.getRawOne<{ total: string }>(),
    ]);

    console.log({ field, totalPatients, totalResult, items });

    return {
      items: items.slice(0, limit),
      total: Number(totalResult?.total || 0),
    };
  }
}
