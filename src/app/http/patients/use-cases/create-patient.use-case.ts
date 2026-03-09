import { ConflictException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DataSource } from 'typeorm';

import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
import type { BrazilianState } from '@/constants/brazilian-states';
import { Patient } from '@/domain/entities/patient';
import { PatientSupport } from '@/domain/entities/patient-support';
import type {
  PatientGender,
  PatientNmoDiagnosis,
  PatientRace,
} from '@/domain/enums/patients';

interface PatientSupportInput {
  name: string;
  phone: string;
  kinship: string;
}

interface CreatePatientUseCaseInput {
  name: string;
  dateOfBirth: Date;
  cpf: string;
  gender: PatientGender;
  race: PatientRace;
  state: BrazilianState;
  city: string;
  email: string;
  phone: string;
  hasDisability: boolean;
  disabilityDesc: string | null;
  needLegalAssistance: boolean;
  takeMedication: boolean;
  medicationDesc: string | null;
  nmoDiagnosis: PatientNmoDiagnosis;
  supports?: PatientSupportInput[];
}

@Logger()
@Injectable()
export class CreatePatientUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {}

  async execute({
    name,
    dateOfBirth,
    cpf,
    gender,
    race,
    state,
    city,
    email,
    phone,
    hasDisability,
    disabilityDesc,
    needLegalAssistance,
    takeMedication,
    medicationDesc,
    nmoDiagnosis,
    supports,
  }: CreatePatientUseCaseInput): Promise<void> {
    this.logger.setEvent('create_patient');

    const patientWithSameEmail = await this.patientsRepository.findOne({
      select: { id: true },
      where: { email },
    });

    if (patientWithSameEmail) {
      this.logger.error('Create patient failed: Email already registered', {
        email,
      });
      throw new ConflictException('O e-mail informado já está registrado.');
    }

    const patientWithSameCpf = await this.patientsRepository.findOne({
      select: { id: true },
      where: { cpf },
    });

    if (patientWithSameCpf) {
      this.logger.error('Create patient failed: CPF already registered', {
        cpf,
      });
      throw new ConflictException('O CPF informado já está registrado.');
    }

    await this.dataSource.transaction(async (manager) => {
      const patientsDataSource = manager.getRepository(Patient);
      const patientSupportsDataSource = manager.getRepository(PatientSupport);

      const patient = patientsDataSource.create({
        name,
        email,
        dateOfBirth,
        cpf,
        gender,
        race,
        state,
        city,
        phone,
        hasDisability,
        disabilityDesc,
        needLegalAssistance,
        takeMedication,
        medicationDesc,
        nmoDiagnosis,
        status: 'active',
      });

      await patientsDataSource.save(patient);

      if (supports && supports.length > 0) {
        const patientSupports = supports.map(({ name, phone, kinship }) =>
          patientSupportsDataSource.create({
            patientId: patient.id,
            name,
            phone,
            kinship,
          }),
        );

        await patientSupportsDataSource.save(patientSupports);
      }

      this.logger.log('Patient created successfully', {
        id: patient.id,
        email,
      });
    });
  }
}
