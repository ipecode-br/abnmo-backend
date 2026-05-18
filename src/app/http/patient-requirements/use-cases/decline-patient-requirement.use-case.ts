import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { AuthUser } from '@/common/types';
import { PatientRequirement } from '@/domain/entities/patient-requirement';

interface DeclinePatientRequirementUseCaseInput {
  id: string;
  user: AuthUser;
}

@Injectable()
@Log()
export class DeclinePatientRequirementUseCase {
  constructor(
    @InjectRepository(PatientRequirement)
    private readonly patientRequirementsRepository: Repository<PatientRequirement>,
    private readonly logger: LogService,
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

    this.logger.log('Patient requirement declined successfully', { id });
  }
}
