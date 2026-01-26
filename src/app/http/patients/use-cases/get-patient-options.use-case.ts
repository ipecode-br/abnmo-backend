import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type FindOptionsWhere, type Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import type { PatientOptionResponse } from '@/domain/schemas/patients/responses';

interface GetPatientOptionsUseCaseOutput {
  patients: PatientOptionResponse[];
  total: number;
}

@Injectable()
export class GetPatientOptionsUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  async execute(): Promise<GetPatientOptionsUseCaseOutput> {
    const where: FindOptionsWhere<Patient> = {
      status: 'active',
    };

    const total = await this.patientsRepository.count({ where });

    const patients = await this.patientsRepository.find({
      select: { id: true, name: true, cpf: true },
      where,
    });

    return { patients, total };
  }
}
