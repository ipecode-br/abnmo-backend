import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { UserSchema } from '@/domain/schemas/user';

import { PatientRequirementsRepository } from './patient-requirements.repository';

@Injectable()
export class PatientRequirementsService {
  private readonly logger = new Logger(PatientRequirementsService.name);

  constructor(
    private readonly patientRequirementsRepository: PatientRequirementsRepository,
  ) {}

  async approveRequirement(id: string, user: UserSchema): Promise<void> {
    const patientRequirement =
      await this.patientRequirementsRepository.findById(id);

    if (!patientRequirement) {
      throw new NotFoundException(`Solicitação não encontrada`);
    }

    if (patientRequirement.status != 'under_review') {
      throw new ConflictException(
        'Solicitação precisa estar aguardando aprovação para ser aprovada',
      );
    }

    await this.patientRequirementsRepository.approvedRequirement(id, user.id);

    this.logger.log(
      { id: patientRequirement.id, userId: user.id, approvedAt: new Date() },
      'Requirement approved successfully',
    );
  }
}
