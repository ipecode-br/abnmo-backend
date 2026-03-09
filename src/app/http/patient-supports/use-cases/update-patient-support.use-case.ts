import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type { AuthUser } from '@/common/types';
import { PatientSupport } from '@/domain/entities/patient-support';

interface UpdatePatientSupportUseCaseInput {
  id: string;
  user: AuthUser;
  name: string;
  phone: string;
  kinship: string;
}

@Injectable()
export class UpdatePatientSupportUseCase {
  private readonly logger = new Logger(UpdatePatientSupportUseCase.name);

  constructor(
    @InjectRepository(PatientSupport)
    private readonly patientSupportsRepository: Repository<PatientSupport>,
  ) {}

  async execute({
    id,
    user,
    name,
    phone,
    kinship,
  }: UpdatePatientSupportUseCaseInput): Promise<void> {
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
        {
          id,
          patientId,
          userId: user.id,
          userEmail: user.email,
          userRole: user.role,
        },
        'Update patient support failed: User does not have permission to update this patient support',
      );
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este contato de apoio.',
      );
    }

    await this.patientSupportsRepository.update(id, { name, phone, kinship });

    this.logger.log(
      {
        id,
        patientId,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
      },
      'Patient support updated successfully',
    );
  }
}
