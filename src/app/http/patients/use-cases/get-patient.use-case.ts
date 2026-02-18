import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';

interface GetPatientUseCaseInput {
  id: string;
}

interface GetPatientUseCaseOutput {
  patient: Omit<Patient, 'password'>;
}

// TODO: remove logger after testing the Next.js cache
@Injectable()
export class GetPatientUseCase {
  private readonly logger = new Logger(GetPatientUseCase.name);

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
        avatar_url: true,
        phone: true,
        cpf: true,
        gender: true,
        race: true,
        date_of_birth: true,
        state: true,
        city: true,
        has_disability: true,
        disability_desc: true,
        need_legal_assistance: true,
        take_medication: true,
        medication_desc: true,
        nmo_diagnosis: true,
        created_at: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    this.logger.log({ name: patient.name }, 'Get patient called');

    return { patient };
  }
}
