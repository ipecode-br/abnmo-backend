import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import { PatientRequirement } from '@/domain/entities/patient-requirement';

import type { AuthUserDto } from '../../auth/auth.dtos';
import type { CreatePatientRequirementDto } from '../patient-requirements.dtos';

interface CreatePatientRequirementUseCaseRequest {
  createPatientRequirementDto: CreatePatientRequirementDto;
  user: AuthUserDto;
}

type CreatePatientRequirementUseCaseResponse = Promise<void>;

@Injectable()
export class CreatePatientRequirementUseCase {
  private readonly logger = new Logger(CreatePatientRequirementUseCase.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(PatientRequirement)
    private readonly patientRequirementsRepository: Repository<PatientRequirement>,
  ) {}

  async execute({
    createPatientRequirementDto,
    user,
  }: CreatePatientRequirementUseCaseRequest): CreatePatientRequirementUseCaseResponse {
    const { patient_id } = createPatientRequirementDto;

    const patient = await this.patientsRepository.findOne({
      where: { id: patient_id },
      select: { id: true },
    });

    if (!patient) {
      this.logger.error(
        { patientId: patient_id },
        'Create requirement failed: Patient not found',
      );
      throw new NotFoundException('Paciente não encontrado.');
    }

    await this.patientRequirementsRepository.save({
      ...createPatientRequirementDto,
      required_by: user.id,
      status: 'under_review',
    });

    this.logger.log(
      { patientId: patient_id, userId: user.id },
      'Requirement created successfully',
    );
  }
}
