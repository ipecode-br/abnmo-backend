import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

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
export class CreatePatientSupportUseCase {
  private readonly logger = new Logger(CreatePatientSupportUseCase.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(PatientSupport)
    private readonly patientSupportsRepository: Repository<PatientSupport>,
  ) {}

  async execute({
    user,
    patientId,
    name,
    kinship,
    phone,
  }: CreatePatientSupportUseCaseInput): Promise<void> {
    if (user.id !== patientId && user.role !== 'admin') {
      this.logger.log(
        { patientId, userId: user.id, userRole: user.role },
        'Create patient support failed: User does not have permission to create patient support for this patient',
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
      patientId: patientId,
      name,
      kinship,
      phone,
    });

    await this.patientSupportsRepository.save(patientSupport);

    this.logger.log(
      {
        id: patientSupport.id,
        patientId,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
      },
      'Patient support created successfully',
    );
  }
}
