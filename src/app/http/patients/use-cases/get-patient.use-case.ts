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
    const startTime = Date.now();

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

    const endTime = Date.now();
    const ms = endTime - startTime;

    this.logger.log({ ms }, 'Patient data returned successfully');

    return { patient };
  }
}
