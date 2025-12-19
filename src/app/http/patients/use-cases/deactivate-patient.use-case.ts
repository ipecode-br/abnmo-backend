import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';

interface DeactivatePatientUseCaseRequest {
  id: string;
}

type DeactivatePatientUseCaseResponse = Promise<void>;

@Injectable()
export class DeactivatePatientUseCase {
  private readonly logger = new Logger(DeactivatePatientUseCase.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  async execute({
    id,
  }: DeactivatePatientUseCaseRequest): DeactivatePatientUseCaseResponse {
    const patient = await this.patientsRepository.findOne({
      select: { id: true, status: true },
      where: { id },
    });

    if (!patient) {
      this.logger.error(
        { patientId: id },
        'Cancel patient failed: Patient not found',
      );
      throw new NotFoundException('Paciente não encontrado.');
    }

    if (patient.status === 'inactive') {
      this.logger.error(
        { patientId: id },
        'Cancel patient failed: Patient already inactive',
      );
      throw new ConflictException('Este paciente já está inativo.');
    }

    await this.patientsRepository.save({ id, status: 'inactive' });

    this.logger.log({ patientId: id }, 'Patient deactivated successfully');
  }
}
