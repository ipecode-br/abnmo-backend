import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type { AuthUser } from '@/common/types';
import { Patient } from '@/domain/entities/patient';

interface DeactivatePatientUseCaseInput {
  id: string;
  user: AuthUser;
}

@Injectable()
export class DeactivatePatientUseCase {
  private readonly logger = new Logger(DeactivatePatientUseCase.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  async execute({ id, user }: DeactivatePatientUseCaseInput): Promise<void> {
    const patient = await this.patientsRepository.findOne({
      select: { id: true, status: true },
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    if (patient.status === 'inactive') {
      throw new ConflictException('Este paciente já está inativo.');
    }

    await this.patientsRepository.update({ id }, { status: 'inactive' });

    this.logger.log(
      {
        patientId: id,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
      },
      'Patient deactivated successfully',
    );
  }
}
