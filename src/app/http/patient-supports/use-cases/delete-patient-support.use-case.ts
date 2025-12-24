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

    const patientId = patientSupport.patient_id;

    if (user.role === 'patient' && user.id !== patientId) {
      this.logger.log(
        {
          id,
          patientId,
          userId: user.id,
          userEmail: user.email,
          role: user.role,
        },
        'Remove patient support failed: User does not have permission to remove this patient support',
      );
      throw new ForbiddenException(
        'Você não tem permissão para remover este contato de apoio.',
      );
    }

    await this.patientSupportsRepository.remove(patientSupport);

    this.logger.log(
      {
        id,
        patientId,
        userId: user.id,
        userEmail: user.email,
        role: user.role,
      },
      'Patient support removed successfully',
    );
  }
}
