import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
import type { AuthUser } from '@/common/types';
import { Patient } from '@/domain/entities/patient';
import { PatientRequirement } from '@/domain/entities/patient-requirement';
import type { PatientRequirementType } from '@/domain/enums/patient-requirements';

interface CreatePatientRequirementUseCaseInput {
  user: AuthUser;
  patientId: string;
  type: PatientRequirementType;
  title: string;
  description: string | null;
}

@Logger()
@Injectable()
export class CreatePatientRequirementUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(PatientRequirement)
    private readonly patientRequirementsRepository: Repository<PatientRequirement>,
    private readonly logger: AppLogger,
  ) {}

  async execute({
    user,
    patientId,
    type,
    title,
    description,
  }: CreatePatientRequirementUseCaseInput): Promise<void> {
    this.logger.setEvent('create_patient_requirement');

    const patient = await this.patientsRepository.findOne({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const patientRequirement = this.patientRequirementsRepository.create({
      patientId,
      type,
      title,
      description,
      createdBy: user.id,
    });

    await this.patientRequirementsRepository.save(patientRequirement);

    this.logger.log('Requirement created successfully', {
      id: patientRequirement.id,
      patientId,
    });
  }
}
