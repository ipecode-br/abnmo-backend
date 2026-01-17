import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DataSource } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import { PatientSupport } from '@/domain/entities/patient-support';

import type { AuthUserDto } from '../../auth/auth.dtos';
import type { CreatePatientDto } from '../patients.dtos';

interface CreatePatientUseCaseInput {
  user: AuthUserDto;
  createPatientDto: CreatePatientDto;
}

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
    user,
    createPatientDto,
  }: CreatePatientUseCaseInput): Promise<void> {
    const { email, cpf, supports, ...patientData } = createPatientDto;

    const patientWithSameEmail = await this.patientsRepository.findOne({
      select: { id: true },
      where: { email },
    });

    if (patientWithSameEmail) {
      this.logger.error(
        { email, userId: user.id, userEmail: user.email, role: user.role },
        'Create patient failed: Email already registered',
      );
      throw new ConflictException('O e-mail informado já está registrado.');
    }

    const patientWithSameCpf = await this.patientsRepository.findOne({
      select: { id: true },
      where: { cpf },
    });

    if (patientWithSameCpf) {
      this.logger.error(
        { cpf, userId: user.id, userEmail: user.email, role: user.role },
        'Create patient failed: CPF already registered',
      );
      throw new ConflictException('O CPF informado já está registrado.');
    }

    await this.dataSource.transaction(async (manager) => {
      const patientsDataSource = manager.getRepository(Patient);
      const patientSupportsDataSource = manager.getRepository(PatientSupport);

      const patient = patientsDataSource.create({
        ...patientData,
        email,
        cpf,
        status: 'active',
      });

      await patientsDataSource.save(patient);

      if (supports && supports.length > 0) {
        const patientSupports = supports.map(({ name, phone, kinship }) =>
          patientSupportsDataSource.create({
            patient_id: patient.id,
            name,
            phone,
            kinship,
          }),
        );

        await patientSupportsDataSource.save(patientSupports);
      }

      this.logger.log(
        {
          patientId: patient.id,
          email,
          userId: user.id,
          userEmail: user.email,
          role: user.role,
        },
        'Patient created successfully',
      );
    });
  }
}
