import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import { PatientSupport } from '@/domain/entities/patient-support';

import type { CreatePatientSupportDto } from '../patient-supports.dtos';

interface CreatePatientSupportUseCaseRequest {
  patientId: string;
  createPatientSupportDto: CreatePatientSupportDto;
}

type CreatePatientSupportUseCaseResponse = Promise<void>;

@Injectable()
export class CreatePatientSupportUseCase {
  private readonly logger = new Logger(CreatePatientSupportUseCase.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(PatientSupport)
    private readonly patientSupportsRepository: Repository<PatientSupport>,
  ) {}

  async execute({
    patientId,
    createPatientSupportDto,
  }: CreatePatientSupportUseCaseRequest): CreatePatientSupportUseCaseResponse {
    const patient = await this.patientsRepository.findOne({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    await this.patientSupportsRepository.save({
      ...createPatientSupportDto,
      patient_id: patientId,
    });

    this.logger.log({ patientId }, 'Support network created successfully');
  }
}
