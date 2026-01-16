import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import { PatientSupport } from '@/domain/entities/patient-support';

import type { AuthUserDto } from '../../auth/auth.dtos';
import type { CreatePatientSupportDto } from '../patient-supports.dtos';

interface CreatePatientSupportUseCaseRequest {
  user: AuthUserDto;
  patientId: string;
  createPatientSupportDto: CreatePatientSupportDto;
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
    createPatientSupportDto,
  }: CreatePatientSupportUseCaseRequest): Promise<void> {
    if (user.id !== patientId) {
      this.logger.log(
        { patientId, userId: user.id, role: user.role },
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
      ...createPatientSupportDto,
      patient_id: patientId,
    });

    await this.patientSupportsRepository.save(patientSupport);

    this.logger.log(
      {
        id: patientSupport.id,
        patientId,
        userId: user.id,
        userEmail: user.email,
        role: user.role,
      },
      'Patient support created successfully',
    );
  }
}
