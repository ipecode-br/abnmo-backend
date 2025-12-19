import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';

import type { CreatePatientDto } from '../patients.dtos';

interface CreatePatientUseCaseRequest {
  createPatientDto: CreatePatientDto;
}

type CreatePatientUseCaseResponse = Promise<void>;

@Injectable()
export class CreatePatientUseCase {
  private readonly logger = new Logger(CreatePatientUseCase.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  async execute({
    createPatientDto,
  }: CreatePatientUseCaseRequest): CreatePatientUseCaseResponse {
    const { email, cpf } = createPatientDto;

    const patientWithEmail = await this.patientsRepository.findOne({
      where: { email },
      select: { id: true },
    });

    if (patientWithEmail) {
      this.logger.error(
        { email },
        'Create patient failed: Email already registered',
      );
      throw new ConflictException('O e-mail informado já está registrado.');
    }

    const patientWithCpf = await this.patientsRepository.findOne({
      where: { cpf },
      select: { id: true },
    });

    if (patientWithCpf) {
      this.logger.error(
        { cpf },
        'Create patient failed: CPF already registered',
      );
      throw new ConflictException('O CPF informado já está registrado.');
    }

    const patient = await this.patientsRepository.save({
      ...createPatientDto,
      status: 'active',
    });

    this.logger.log(
      { patientId: patient.id, email },
      'Patient created successfully',
    );
  }
}
