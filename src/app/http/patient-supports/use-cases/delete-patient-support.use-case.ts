import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { AuthUser } from '@/common/types';
import { PatientSupport } from '@/domain/entities/patient-support';

interface DeletePatientSupportUseCaseInput {
  id: string;
  user: AuthUser;
}

@Injectable()
@Log()
export class DeletePatientSupportUseCase {
  constructor(
    @InjectRepository(PatientSupport)
    private readonly patientSupportsRepository: Repository<PatientSupport>,
    private readonly logger: LogService,
  ) {}

  async execute({ id, user }: DeletePatientSupportUseCaseInput): Promise<void> {
    const patientSupport = await this.patientSupportsRepository.findOne({
      select: { id: true, patientId: true },
      where: { id },
    });

    if (!patientSupport) {
      throw new NotFoundException('Contato de apoio não encontrado.');
    }

    const patientId = patientSupport.patientId;

    if (user.role === 'patient' && user.id !== patientId) {
      this.logger.log(
        'Delete patient support failed: User does not have permission to remove this patient support',
        { id, patientId },
      );
      throw new ForbiddenException(
        'Você não tem permissão para remover este contato de apoio.',
      );
    }

    await this.patientSupportsRepository.remove(patientSupport);

    this.logger.log('Patient support removed successfully', { id, patientId });
  }
}
