import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';

import type { UpdatePatientDto } from '../patients.dtos';

interface UpdatePatientUseCaseRequest {
  updatePatientDto: UpdatePatientDto;
  id: string;
}

type UpdatePatientUseCaseResponse = Promise<void>;

@Injectable()
export class UpdatePatientUseCase {
  private readonly logger = new Logger(UpdatePatientUseCase.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  async execute({
    id,
    updatePatientDto,
  }: UpdatePatientUseCaseRequest): UpdatePatientUseCaseResponse {
    const patient = await this.patientsRepository.findOne({
      select: { id: true, email: true, cpf: true },
      where: { id },
    });

    if (!patient) {
      this.logger.error(
        { patientId: id },
        'Update patient failed: Patient not found',
      );
      throw new NotFoundException('Paciente não encontrado.');
    }

    if (updatePatientDto.cpf && updatePatientDto.cpf !== patient.cpf) {
      const patientWithCpf = await this.patientsRepository.findOne({
        where: { cpf: updatePatientDto.cpf },
        select: { id: true },
      });

      if (patientWithCpf && patientWithCpf.id !== id) {
        this.logger.error(
          { patientId: id, cpf: updatePatientDto.cpf },
          'Update patient failed: CPF already registered',
        );
        throw new ConflictException('O CPF informado já está registrado.');
      }
    }

    if (updatePatientDto.email && updatePatientDto.email !== patient.email) {
      const patientWithEmail = await this.patientsRepository.findOne({
        where: { email: updatePatientDto.email },
        select: { id: true },
      });

      if (patientWithEmail && patientWithEmail.id !== id) {
        this.logger.error(
          { patientId: id, email: updatePatientDto.email },
          'Update patient failed: Email already registered',
        );
        throw new ConflictException('O e-mail informado já está registrado.');
      }
    }

    await this.patientsRepository.save({ id, ...updatePatientDto });

    this.logger.log({ patientId: id }, 'Patient updated successfully');
  }
}
