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

interface DeclinePatientRequirementUseCaseInput {
  id: string;
  user: AuthUserDto;
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

    await this.patientRequirementsRepository.save({
      id,
      status: 'declined',
      declined_by: user.id,
      declined_at: new Date(),
    });

    this.logger.log(
      { id, userId: user.id, userEmail: user.email, userRole: user.role },
      'Patient requirement declined successfully',
    );
  }
}
