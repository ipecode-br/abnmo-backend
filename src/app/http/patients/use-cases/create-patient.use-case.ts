import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DataSource } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import { PatientSupport } from '@/domain/entities/patient-support';

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
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute({
    createPatientDto,
  }: CreatePatientUseCaseRequest): CreatePatientUseCaseResponse {
    const { email, cpf, supports, ...patientData } = createPatientDto;

    const patientWithEmail = await this.patientsRepository.findOne({
      select: { id: true },
      where: { email },
    });

    if (patientWithEmail) {
      this.logger.error(
        { email },
        'Create patient failed: Email already registered',
      );
      throw new ConflictException('O e-mail informado já está registrado.');
    }

    const patientWithCpf = await this.patientsRepository.findOne({
      select: { id: true },
      where: { cpf },
    });

    if (patientWithCpf) {
      this.logger.error(
        { cpf },
        'Create patient failed: CPF already registered',
      );
      throw new ConflictException('O CPF informado já está registrado.');
    }

    await this.dataSource.transaction(async (manager) => {
      const patientsDataSource = manager.getRepository(Patient);
      const patientSupportsDataSource = manager.getRepository(PatientSupport);

      const patient = await patientsDataSource.save({
        ...patientData,
        email,
        cpf,
        status: 'active',
      });

      if (supports && supports.length > 0) {
        const patientSupports = supports.map((support) =>
          patientSupportsDataSource.create({
            name: support.name,
            phone: support.phone,
            kinship: support.kinship,
            patient_id: patient.id,
          }),
        );

        await patientSupportsDataSource.save(patientSupports);
      }

      this.logger.log(
        { patientId: patient.id, email },
        'Patient created successfully',
      );
    });
  }
}
