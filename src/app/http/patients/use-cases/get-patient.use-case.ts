import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Logger } from '@/common/log/logger.decorator';
import { Patient } from '@/domain/entities/patient';

interface GetPatientUseCaseInput {
  id: string;
}

interface GetPatientUseCaseOutput {
  patient: Omit<Patient, 'password'>;
}

@Logger()
@Injectable()
export class GetPatientUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  async execute({
    id,
  }: GetPatientUseCaseInput): Promise<GetPatientUseCaseOutput> {
    const patient = await this.patientsRepository.findOne({
      relations: { supports: true },
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        avatarUrl: true,
        phone: true,
        cpf: true,
        gender: true,
        race: true,
        dateOfBirth: true,
        state: true,
        city: true,
        hasDisability: true,
        disabilityDesc: true,
        needLegalAssistance: true,
        takeMedication: true,
        medicationDesc: true,
        nmoDiagnosis: true,
        createdAt: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    return { patient };
  }
}
