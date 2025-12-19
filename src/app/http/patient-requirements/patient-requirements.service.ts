import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';

import type { AuthUserDto } from '../auth/auth.dtos';
import { CreatePatientRequirementDto } from './patient-requirements.dtos';
import { PatientRequirementsRepository } from './patient-requirements.repository';

@Injectable()
export class PatientRequirementsService {
  private readonly logger = new Logger(PatientRequirementsService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly patientRequirementsRepository: PatientRequirementsRepository,
  ) {}

  async create(
    createPatientRequirementDto: CreatePatientRequirementDto,
    authUser: AuthUserDto,
  ): Promise<void> {
    const { patient_id } = createPatientRequirementDto;

    const patient = await this.patientsRepository.findOne({
      where: { id: patient_id },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    await this.patientRequirementsRepository.create({
      ...createPatientRequirementDto,
      required_by: authUser.id,
    });

    this.logger.log(
      { patientId: patient_id, createdBy: authUser.id },
      'Requirement created successfully',
    );
  }

  async approve(id: string, authUser: AuthUserDto): Promise<void> {
    const patientRequirement =
      await this.patientRequirementsRepository.findById(id);

    if (!patientRequirement) {
      throw new NotFoundException('Request not found.');
    }

    if (patientRequirement.status !== 'under_review') {
      throw new ConflictException(
        'Request must be awaiting approval to be approved.',
      );
    }

    await this.patientRequirementsRepository.approve(id, authUser.id);

    this.logger.log(
      {
        id: patientRequirement.id,
        userId: authUser.id,
        approvedAt: new Date(),
      },
      'Requirement approved successfully',
    );
  }

  async decline(id: string, authUser: AuthUserDto): Promise<void> {
    const requirement = await this.patientRequirementsRepository.findById(id);

    if (!requirement) {
      throw new NotFoundException('Request not found.');
    }

    if (requirement.status !== 'under_review')
      throw new ConflictException(
        'Request must be awaiting approval to be declined.',
      );

    await this.patientRequirementsRepository.decline(id, authUser.id);

    this.logger.log(
      { id: requirement.id, userId: authUser.id, approvedAt: new Date() },
      'Requirement declined successfully',
    );
  }
}
