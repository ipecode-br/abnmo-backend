import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { AuthUser } from '@/common/types';
import { Patient } from '@/domain/entities/patient';
import { PatientSupport } from '@/domain/entities/patient-support';

interface CreatePatientSupportUseCaseInput {
  user: AuthUser;
  patientId: string;
  name: string;
  kinship: string;
  phone: string;
}

@Injectable()
@Log()
export class CreatePatientSupportUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(PatientSupport)
    private readonly patientSupportsRepository: Repository<PatientSupport>,
    private readonly logger: LogService,
  ) {}

  async execute({
    user,
    patientId,
    name,
    kinship,
    phone,
  }: CreatePatientSupportUseCaseInput): Promise<void> {
    if (user.role === 'patient' && user.id !== patientId) {
      this.logger.warn(
        'Create patient support failed: patient does not have permission to create support for another patient',
        { patientId },
      );
      throw new ForbiddenException(
        'Você não tem permissão para criar um contato de apoio para este paciente.',
      );
    }

    const patient = await this.patientsRepository.findOne({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const patientSupport = this.patientSupportsRepository.create({
      patientId,
      name,
      kinship,
      phone,
    });

    await this.patientSupportsRepository.save(patientSupport);

    this.logger.log('Patient support created successfully', {
      id: patientSupport.id,
      patientId,
    });
  }
}
