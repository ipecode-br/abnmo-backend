import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type FindOptionsWhere, type Repository } from 'typeorm';

import { User } from '@/domain/entities/user';
import type { PatientOptionResponse } from '@/domain/schemas/patients/responses';

interface GetPatientOptionsUseCaseOutput {
  patients: PatientOptionResponse[];
  total: number;
}

@Injectable()
export class GetPatientOptionsUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async execute(): Promise<GetPatientOptionsUseCaseOutput> {
    const where: FindOptionsWhere<User> = { role: 'patient', status: 'active' };

    const total = await this.usersRepository.count({ where });

    const result = await this.usersRepository.find({
      select: { id: true, name: true, cpf: true },
      order: { name: 'ASC' },
      where,
    });

    return {
      patients: result.map((patient) => ({
        id: patient.id,
        name: patient.name,
        cpf: patient.cpf,
      })),
      total,
    };
  }
}
