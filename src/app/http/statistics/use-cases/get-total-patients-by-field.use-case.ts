import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import type { PatientsStatisticField } from '@/domain/enums/statistics';
import { UtilsService } from '@/utils/utils.service';

import type { GetTotalPatientsByFieldQuery } from '../statistics.dtos';
import { GetTotalPatientsUseCase } from './get-total-patients.use-case';

interface GetTotalPatientsByFieldUseCaseRequest {
  field: PatientsStatisticField;
  query: GetTotalPatientsByFieldQuery;
}

interface GetTotalPatientsByFieldUseCaseResponse<T> {
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
    query,
  }: GetTotalPatientsByFieldUseCaseRequest): Promise<
    GetTotalPatientsByFieldUseCaseResponse<T>
  > {
    const { startDate, endDate } = this.utilsService.getDateRangeForPeriod(
      query.period,
    );

    const totalPatients = await this.getTotalPatientsUseCase.execute({
      startDate,
      endDate,
    });

    const createBaseQuery = (): SelectQueryBuilder<Patient> => {
      return this.patientsRepository
        .createQueryBuilder('patient')
        .where('patient.created_at BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        });
    };

    const totalFieldQuery = createBaseQuery().select(
      `COUNT(DISTINCT patient.${field})`,
      'total',
    );

    const fieldQuery = createBaseQuery()
      .select(`patient.${field}`, field)
      .addSelect('COUNT(patient.id)', 'total')
      .groupBy(`patient.${field}`)
      .orderBy('total', query.order)
      .limit(query.limit);

    if (query.withPercentage) {
      fieldQuery.addSelect(
        `ROUND((COUNT(patient.id) * 100.0 / ${totalPatients}), 1)`,
        'percentage',
      );
    }

    const [items, totalResult] = await Promise.all([
      fieldQuery.getRawMany<T>(),
      totalFieldQuery.getRawOne<{ total: string }>(),
    ]);

    return { items, total: Number(totalResult?.total || 0) };
  }
}
