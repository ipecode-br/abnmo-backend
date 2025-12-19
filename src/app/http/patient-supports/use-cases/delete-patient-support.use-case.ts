import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { PatientSupport } from '@/domain/entities/patient-support';

import type { AuthUserDto } from '../../auth/auth.dtos';

interface DeletePatientSupportUseCaseRequest {
  id: string;
  user: AuthUserDto;
}

type DeletePatientSupportUseCaseResponse = Promise<void>;

@Injectable()
export class DeletePatientSupportUseCase {
  private readonly logger = new Logger(DeletePatientSupportUseCase.name);

  constructor(
    @InjectRepository(PatientSupport)
    private readonly patientSupportsRepository: Repository<PatientSupport>,
  ) {}

  async execute({
    id,
    user,
  }: DeletePatientSupportUseCaseRequest): DeletePatientSupportUseCaseResponse {
    const patientSupport = await this.patientSupportsRepository.findOne({
      select: { id: true, patient_id: true },
      where: { id },
    });

    if (!patientSupport) {
      throw new NotFoundException('Contato de apoio não encontrado.');
    }

    if (user.role === 'patient' && user.id !== patientSupport.patient_id) {
      throw new ForbiddenException(
        'Você não tem permissão para remover este contato de apoio.',
      );
    }

    await this.patientSupportsRepository.remove(patientSupport);

    this.logger.log(
      { id, patientId: patientSupport.patient_id },
      'Support network removed successfully',
    );
  }
}
