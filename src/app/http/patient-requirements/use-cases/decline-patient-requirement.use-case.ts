import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type { AuthUser } from '@/common/types';
import { PatientRequirement } from '@/domain/entities/patient-requirement';

interface DeclinePatientRequirementUseCaseInput {
  id: string;
  user: AuthUser;
}

@Injectable()
export class DeclinePatientRequirementUseCase {
  private readonly logger = new Logger(DeclinePatientRequirementUseCase.name);

  constructor(
    @InjectRepository(PatientRequirement)
    private readonly patientRequirementsRepository: Repository<PatientRequirement>,
  ) {}

  async execute({
    id,
    user,
  }: DeclinePatientRequirementUseCaseInput): Promise<void> {
    const requirement = await this.patientRequirementsRepository.findOne({
      select: { id: true, status: true },
      where: { id },
    });

    if (!requirement) {
      throw new NotFoundException('Solicitação não encontrada.');
    }

    if (requirement.status !== 'under_review') {
      throw new ConflictException(
        'A solicitação deve estar aguardando aprovação.',
      );
    }

    await this.patientRequirementsRepository.update(id, {
      status: 'declined',
      declinedBy: user.id,
      declinedAt: new Date(),
    });

    this.logger.log(
      { id, userId: user.id, userEmail: user.email, userRole: user.role },
      'Patient requirement declined successfully',
    );
  }
}
