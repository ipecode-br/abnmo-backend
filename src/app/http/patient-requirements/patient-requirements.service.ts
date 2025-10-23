import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { UserSchema } from '@/domain/schemas/user';

import { PatientsRequirementRepository } from './patient-requirements.repository';

@Injectable()
export class PatientRequirementsService {
  private readonly logger = new Logger(PatientRequirementsService.name);

  constructor(
    private readonly patientsRequirementRepository: PatientsRequirementRepository,
  ) {}

  async approveRequirement(id: string, user: UserSchema): Promise<void> {
    const patientRequirement =
      await this.patientsRequirementRepository.findById(id);

    if (!patientRequirement) {
      throw new NotFoundException(`Solicitação de id ${id} não encontrada`);
    }

    if (patientRequirement.status != 'under_review') {
      throw new ConflictException(
        'Solicitação precisa ter status under_review para ser aprovada',
      );
    }

    await this.patientsRequirementRepository.approvedRequirement(id, user.id);

    this.logger.log(
      {
        id: patientRequirement.id,
        userId: user.id,
        approvedAt: new Date(),
      },
      'Requirement approved successfully',
    );
  }
}
