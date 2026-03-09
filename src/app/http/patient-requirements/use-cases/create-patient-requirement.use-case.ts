import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

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
    user,
    patientId,
    type,
    title,
    description,
  }: CreatePatientRequirementUseCaseInput): Promise<void> {
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

    this.logger.log(
      {
        id: patientRequirement.id,
        patientId,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
      },
      'Requirement created successfully',
    );
  }
}
