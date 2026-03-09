import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
import type { AuthUser } from '@/common/types';
import type { BrazilianState } from '@/constants/brazilian-states';
import { Patient } from '@/domain/entities/patient';
import type {
  PatientGender,
  PatientNmoDiagnosis,
  PatientRace,
} from '@/domain/enums/patients';

interface UpdatePatientUseCaseInput {
  id: string;
  user: AuthUser;
  name?: string;
  dateOfBirth?: Date;
  cpf?: string;
  gender?: PatientGender;
  race?: PatientRace;
  state?: BrazilianState;
  city?: string;
  email?: string;
  phone?: string;
  hasDisability?: boolean;
  disabilityDesc?: string | null;
  needLegalAssistance?: boolean;
  takeMedication?: boolean;
  medicationDesc?: string | null;
  nmoDiagnosis?: PatientNmoDiagnosis;
}

@Logger()
@Injectable()
export class UpdatePatientUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly logger: AppLogger,
  ) {}

  async execute({
    id,
    user,
    cpf,
    email,
    ...props
  }: UpdatePatientUseCaseInput): Promise<void> {
    this.logger.setEvent('update_patient');

    if (user.role === 'patient' && user.id !== id) {
      this.logger.log(
        'Update patient failed: User does not have permission to update this patient',
        { id },
      );
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este paciente.',
      );
    }

    const patient = await this.patientsRepository.findOne({
      select: { id: true, email: true, cpf: true },
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    if (cpf && cpf !== patient.cpf) {
      const patientWithSameCpf = await this.patientsRepository.findOne({
        where: { cpf },
        select: { id: true },
      });

      if (patientWithSameCpf && patientWithSameCpf.id !== id) {
        this.logger.error('Update patient failed: CPF already registered', {
          id,
          cpf,
        });
        throw new ConflictException('O CPF informado já está registrado.');
      }
    }

    if (email && email !== patient.email) {
      const patientWithSameEmail = await this.patientsRepository.findOne({
        where: { email },
        select: { id: true },
      });

      if (patientWithSameEmail && patientWithSameEmail.id !== id) {
        this.logger.error('Update patient failed: Email already registered', {
          id,
          email,
        });
        throw new ConflictException('O e-mail informado já está registrado.');
      }
    }

    await this.patientsRepository.update(id, { cpf, email, ...props });

    this.logger.log('Patient updated successfully', { id });
  }
}
