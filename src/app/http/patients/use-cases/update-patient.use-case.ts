import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';

import type { AuthUserDto } from '../../auth/auth.dtos';
import type { UpdatePatientDto } from '../patients.dtos';

interface UpdatePatientUseCaseRequest {
  id: string;
  user: AuthUserDto;
  updatePatientDto: UpdatePatientDto;
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
    updatePatientDto,
  }: UpdatePatientUseCaseRequest): Promise<void> {
    if (user.role === 'patient' && user.id !== id) {
      this.logger.log(
        { id, userId: user.id, userEmail: user.email, role: user.role },
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

    if (updatePatientDto.cpf !== patient.cpf) {
      const patientWithSameCpf = await this.patientsRepository.findOne({
        where: { cpf: updatePatientDto.cpf },
        select: { id: true },
      });

      if (patientWithSameCpf && patientWithSameCpf.id !== id) {
        this.logger.error(
          {
            patientId: id,
            cpf: updatePatientDto.cpf,
            userId: user.id,
            userEmail: user.email,
            role: user.role,
          },
          'Update patient failed: CPF already registered',
        );
        throw new ConflictException('O CPF informado já está registrado.');
      }
    }

    if (updatePatientDto.email !== patient.email) {
      const patientWithSameEmail = await this.patientsRepository.findOne({
        where: { email: updatePatientDto.email },
        select: { id: true },
      });

      if (patientWithSameEmail && patientWithSameEmail.id !== id) {
        this.logger.error(
          {
            patientId: id,
            email: updatePatientDto.email,
            userId: user.id,
            userEmail: user.email,
            role: user.role,
          },
          'Update patient failed: Email already registered',
        );
        throw new ConflictException('O e-mail informado já está registrado.');
      }
    }

    await this.patientsRepository.save({ id, ...updatePatientDto });

    this.logger.log(
      {
        patientId: id,
        userId: user.id,
        userEmail: user.email,
        role: user.role,
      },
      'Patient updated successfully',
    );
  }
}
