import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
import type { AuthUser } from '@/common/types';
import { PatientRequirement } from '@/domain/entities/patient-requirement';

interface ApprovePatientRequirementUseCaseInput {
  id: string;
  user: AuthUser;
}

@Logger()
@Injectable()
export class ApprovePatientRequirementUseCase {
  constructor(
    @InjectRepository(PatientRequirement)
    private readonly patientRequirementsRepository: Repository<PatientRequirement>,
    private readonly logger: AppLogger,
  ) {}

  async execute({
    id,
    user,
  }: ApprovePatientRequirementUseCaseInput): Promise<void> {
    this.logger.setEvent('approve_patient_requirement');

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
      status: 'approved',
      approvedBy: user.id,
      approvedAt: new Date(),
    });

    this.logger.log('Patient requirement approved successfully', { id });
  }
}
