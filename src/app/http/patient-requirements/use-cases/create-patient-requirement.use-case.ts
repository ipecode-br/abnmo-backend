import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import { PatientRequirement } from '@/domain/entities/patient-requirement';

import type { AuthUserDto } from '../../auth/auth.dtos';
import type { CreatePatientRequirementDto } from '../patient-requirements.dtos';

interface CreatePatientRequirementUseCaseInput {
  createPatientRequirementDto: CreatePatientRequirementDto;
  user: AuthUserDto;
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
    createPatientRequirementDto,
    user,
  }: CreatePatientRequirementUseCaseInput): Promise<void> {
    const { patient_id } = createPatientRequirementDto;

    const patient = await this.patientsRepository.findOne({
      where: { id: patient_id },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const patientRequirement = this.patientRequirementsRepository.create({
      ...createPatientRequirementDto,
      created_by: user.id,
    });

    await this.patientRequirementsRepository.save(patientRequirement);

    this.logger.log(
      {
        id: patientRequirement.id,
        patientId: patient_id,
        userId: user.id,
        userEmail: user.email,
        role: user.role,
      },
      'Requirement created successfully',
    );
  }
}
