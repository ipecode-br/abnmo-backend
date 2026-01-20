import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';

interface GetTotalPatientsByStatusUseCaseOutput {
  total: number;
  active: number;
  inactive: number;
}

@Injectable()
export class GetTotalPatientsByStatusUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  async execute(): Promise<GetTotalPatientsByStatusUseCaseOutput> {
    const query = await this.patientsRepository
      .createQueryBuilder('patient')
      .select('COUNT(patient.id)', 'total')
      .where('patient.status != :status', { status: 'pending' })
      .addSelect(
        `SUM(CASE WHEN patient.status = 'active' THEN 1 ELSE 0 END)`,
        'active',
      )
      .addSelect(
        `SUM(CASE WHEN patient.status = 'inactive' THEN 1 ELSE 0 END)`,
        'inactive',
      )
      .getRawOne<{ total: string; active: string; inactive: string }>();

    return {
      total: Number(query?.total ?? 0),
      active: Number(query?.active ?? 0),
      inactive: Number(query?.inactive ?? 0),
    };
  }
}
