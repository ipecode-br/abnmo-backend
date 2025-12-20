import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PatientRequirement } from '@/domain/entities/patient-requirement';

import type { AuthUserDto } from '../../auth/auth.dtos';

interface ApprovePatientRequirementUseCaseRequest {
  id: string;
  user: AuthUserDto;
}

type ApprovePatientRequirementUseCaseResponse = Promise<void>;

@Injectable()
export class ApprovePatientRequirementUseCase {
  private readonly logger = new Logger(ApprovePatientRequirementUseCase.name);

  constructor(
    @InjectRepository(PatientRequirement)
    private readonly patientRequirementsRepository: Repository<PatientRequirement>,
  ) {}

  async execute({
    id,
    user,
  }: ApprovePatientRequirementUseCaseRequest): ApprovePatientRequirementUseCaseResponse {
    const requirement = await this.patientRequirementsRepository.findOne({
      select: { id: true, status: true },
      where: { id },
    });

    if (!requirement) {
      this.logger.error(
        { id },
        'Approve patient requirement failed: Requirement not found',
      );
      throw new NotFoundException('Solicitação não encontrada.');
    }

    if (requirement.status !== 'under_review') {
      this.logger.error(
        { id, status: requirement.status },
        'Approve patient requirement failed: Invalid status',
      );
      throw new ConflictException(
        'A solicitação deve estar aguardando aprovação.',
      );
    }

    await this.patientRequirementsRepository.save({
      id,
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date(),
    });

    this.logger.log({ id }, 'Patient requirement approved successfully');
  }
}
