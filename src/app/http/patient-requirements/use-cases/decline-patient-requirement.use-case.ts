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

interface DeclinePatientRequirementUseCaseRequest {
  id: string;
  user: AuthUserDto;
}

type DeclinePatientRequirementUseCaseResponse = Promise<void>;

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
  }: DeclinePatientRequirementUseCaseRequest): DeclinePatientRequirementUseCaseResponse {
    const requirement = await this.patientRequirementsRepository.findOne({
      select: { id: true, status: true },
      where: { id },
    });

    if (!requirement) {
      this.logger.error(
        { id },
        'Decline patient requirement failed: Requirement not found',
      );
      throw new NotFoundException('Solicitação não encontrada.');
    }

    if (requirement.status !== 'under_review') {
      this.logger.error(
        { id, status: requirement.status },
        'Decline patient requirement failed: Invalid status',
      );
      throw new ConflictException(
        'A solicitação deve estar aguardando aprovação.',
      );
    }

    await this.patientRequirementsRepository.save({
      id,
      status: 'declined',
      approved_by: user.id,
      approved_at: new Date(),
    });

    this.logger.log({ id }, 'Patient requirement declined successfully');
  }
}
