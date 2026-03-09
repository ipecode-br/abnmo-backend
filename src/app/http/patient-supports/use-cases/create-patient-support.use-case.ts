import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
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

@Logger()
@Injectable()
export class CreatePatientSupportUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(PatientSupport)
    private readonly patientSupportsRepository: Repository<PatientSupport>,
    private readonly logger: AppLogger,
  ) {}

  async execute({
    user,
    patientId,
    name,
    kinship,
    phone,
  }: CreatePatientSupportUseCaseInput): Promise<void> {
    this.logger.setEvent('create_patient_support');

    if (user.id !== patientId && user.role !== 'admin') {
      this.logger.log(
        'Create patient support failed: User does not have permission to create patient support for this patient',
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
