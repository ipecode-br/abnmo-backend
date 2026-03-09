import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

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

@Injectable()
export class UpdatePatientUseCase {
  private readonly logger = new Logger(UpdatePatientUseCase.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  async execute({
    id,
    user,
    cpf,
    email,
    ...props
  }: UpdatePatientUseCaseInput): Promise<void> {
    if (user.role === 'patient' && user.id !== id) {
      this.logger.log(
        { id, userId: user.id, userEmail: user.email, userRole: user.role },
        'Update patient failed: User does not have permission to update this patient',
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
        this.logger.error(
          {
            patientId: id,
            cpf,
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
          },
          'Update patient failed: CPF already registered',
        );
        throw new ConflictException('O CPF informado já está registrado.');
      }
    }

    if (email && email !== patient.email) {
      const patientWithSameEmail = await this.patientsRepository.findOne({
        where: { email },
        select: { id: true },
      });

      if (patientWithSameEmail && patientWithSameEmail.id !== id) {
        this.logger.error(
          {
            id,
            email,
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
          },
          'Update patient failed: Email already registered',
        );
        throw new ConflictException('O e-mail informado já está registrado.');
      }
    }

    await this.patientsRepository.update(id, { cpf, email, ...props });

    this.logger.log(
      { id, userId: user.id, userEmail: user.email, userRole: user.role },
      'Patient updated successfully',
    );
  }
}
