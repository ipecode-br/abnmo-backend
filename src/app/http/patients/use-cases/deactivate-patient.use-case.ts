import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { Patient } from '@/domain/entities/patient';

interface DeactivatePatientUseCaseInput {
  id: string;
}

@Log()
@Injectable()
export class DeactivatePatientUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly logger: LogService,
  ) {}

  async execute({ id }: DeactivatePatientUseCaseInput): Promise<void> {
    this.logger.setEvent('deactivate_patient');

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

    this.logger.log('Patient deactivated successfully', { id });
  }
}
