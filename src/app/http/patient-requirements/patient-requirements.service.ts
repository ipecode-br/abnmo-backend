import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import type { AuthUserDto } from '../auth/auth.dtos';
import { PatientsRepository } from '../patients/patients.repository';
import { CreatePatientRequirementDto } from './patient-requirements.dtos';
import { PatientRequirementsRepository } from './patient-requirements.repository';

@Injectable()
export class PatientRequirementsService {
  private readonly logger = new Logger(PatientRequirementsService.name);

  constructor(
    private readonly patientRequirementsRepository: PatientRequirementsRepository,
    private readonly patientsRepository: PatientsRepository,
  ) {}

  async create(
    createPatientRequirementDto: CreatePatientRequirementDto,
    authUser: AuthUserDto,
  ): Promise<void> {
    const { patient_id } = createPatientRequirementDto;

    const patient = await this.patientsRepository.findById(patient_id);

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
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
      throw new NotFoundException('Solicitação não encontrada');
    }

    if (patientRequirement.status !== 'under_review') {
      throw new ConflictException(
        'Solicitação precisa estar aguardando aprovação para ser aprovada.',
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
      throw new NotFoundException('Solicitação não encontrada.');
    }

    if (requirement.status !== 'under_review')
      throw new ConflictException(
        'Solicitação precisa estar aguardando aprovação para ser recusada.',
      );

    await this.patientRequirementsRepository.decline(id, authUser.id);

    this.logger.log(
      { id: requirement.id, userId: authUser.id, approvedAt: new Date() },
      'Requirement declined successfully',
    );
  }
}
