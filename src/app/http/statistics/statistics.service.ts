import { Injectable } from '@nestjs/common';

import type { GetPatientsTotalResponseSchema } from '@/domain/schemas/statistics';

import { PatientsRepository } from '../patients/patients.repository';

@Injectable()
export class StatisticsService {
  constructor(private readonly patientsRepository: PatientsRepository) {}

  async getPatientsTotal(): Promise<GetPatientsTotalResponseSchema['data']> {
    return await this.patientsRepository.getPatientsTotal();
  }
}
