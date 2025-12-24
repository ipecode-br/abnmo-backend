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
import type { UpdatePatientSupportDto } from '../patient-supports.dtos';

interface UpdatePatientSupportUseCaseRequest {
  id: string;
  user: AuthUserDto;
  updatePatientSupportDto: UpdatePatientSupportDto;
}

type UpdatePatientSupportUseCaseResponse = Promise<void>;

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
    updatePatientSupportDto,
  }: UpdatePatientSupportUseCaseRequest): UpdatePatientSupportUseCaseResponse {
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
        'Update patient support failed: User does not have permission to update this patient support',
      );
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este contato de apoio.',
      );
    }

    await this.patientSupportsRepository.save({
      id,
      ...updatePatientSupportDto,
    });

    this.logger.log(
      {
        id,
        patientId,
        userId: user.id,
        userEmail: user.email,
        role: user.role,
      },
      'Patient support updated successfully',
    );
  }
}
