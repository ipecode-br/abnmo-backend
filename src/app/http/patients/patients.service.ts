import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { Patient } from '@/domain/entities/patient';
import { PatientSupport } from '@/domain/entities/patient-support';
import { User } from '@/domain/entities/user';
import type { UserSchema } from '@/domain/schemas/user';

import {
  CreatePatientDto,
  type PatientScreeningDto,
  UpdatePatientDto,
} from './patients.dtos';
import { PatientsRepository } from './patients.repository';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly patientsRepository: PatientsRepository,
    private readonly cryptographyService: CryptographyService,
  ) {}

  async screening(
    patientScreeningDto: PatientScreeningDto,
    user: UserSchema,
  ): Promise<void> {
    if (user.role !== 'patient') {
      this.logger.error(
        { userId: user.id, email: user.email },
        'Screening failed: User is not a patient',
      );
      throw new ForbiddenException(
        'Você não tem permissão para executar esta ação.',
      );
    }

    const patient = await this.patientsRepository.findByUserId(user.id);

    if (patient) {
      this.logger.error(
        { userId: user.id, email: user.email },
        'Screening failed: Patient already registered',
      );
      throw new ConflictException('Você já concluiu a triagem.');
    }

    const patientWithSameCpf = await this.patientsRepository.findByCpf(
      patientScreeningDto.cpf,
    );

    if (patientWithSameCpf) {
      this.logger.error(
        { userId: user.id, email: user.email, cpf: patientScreeningDto.cpf },
        'Screening failed: CPF already registered',
      );
      throw new ConflictException('Este CPF já está cadastrado.');
    }

    return await this.dataSource.transaction(async (manager) => {
      const patientsDataSource = manager.getRepository(Patient);
      const patientsSupportDataSource = manager.getRepository(PatientSupport);

      const createdPatient = patientsDataSource.create(patientScreeningDto);
      const savedPatient = await patientsDataSource.save(createdPatient);

      if (patientScreeningDto.supports.length > 0) {
        const patientSupports = patientScreeningDto.supports.map((support) =>
          patientsSupportDataSource.create({
            name: support.name,
            phone: support.phone,
            kinship: support.kinship,
            patient_id: savedPatient.id,
          }),
        );

        await patientsSupportDataSource.save(patientSupports);
      }

      this.logger.log(
        {
          id: savedPatient.id,
          userId: savedPatient.user_id,
          email: user.email,
        },
        'Screening: Patient created successfully',
      );
    });
  }

  async create(createPatientDto: CreatePatientDto): Promise<void> {
    const patient = await this.patientsRepository.findByEmail(
      createPatientDto.email,
    );

    if (patient) {
      this.logger.error(
        { email: createPatientDto.email },
        'Create patient failed: E-mail already registered',
      );
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const patientWithSameCpf = await this.patientsRepository.findByCpf(
      createPatientDto.cpf,
    );

    if (patientWithSameCpf) {
      this.logger.error(
        { email: createPatientDto.email, cpf: createPatientDto.cpf },
        'Create patient failed: CPF already registered',
      );
      throw new ConflictException('Este CPF já está cadastrado.');
    }

    return await this.dataSource.transaction(async (manager) => {
      const usersDataSource = manager.getRepository(User);
      const patientsDataSource = manager.getRepository(Patient);
      const patientsSupportDataSource = manager.getRepository(PatientSupport);

      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword =
        await this.cryptographyService.createHash(randomPassword);

      const newUser = usersDataSource.create({
        name: createPatientDto.name,
        email: createPatientDto.email,
        password: hashedPassword,
      });

      const user = await usersDataSource.save(newUser);

      const patient = patientsDataSource.create({
        ...createPatientDto,
        user_id: user.id,
      });

      const savedPatient = await patientsDataSource.save(patient);

      if (createPatientDto.supports.length > 0) {
        const patientSupports = createPatientDto.supports.map((support) =>
          patientsSupportDataSource.create({
            name: support.name,
            phone: support.phone,
            kinship: support.kinship,
            patient_id: savedPatient.id,
          }),
        );

        await patientsSupportDataSource.save(patientSupports);
      }

      this.logger.log(
        {
          id: savedPatient.id,
          userId: savedPatient.user_id,
          email: user.email,
        },
        'Patient created successfully',
      );
    });
  }

  async update(id: string, updatePatientDto: UpdatePatientDto): Promise<void> {
    const patient = await this.patientsRepository.findById(id);

    if (!patient) {
      this.logger.error(
        { email: updatePatientDto.email },
        'Update patient failed: Patient not found',
      );
      throw new NotFoundException('Paciente não encontrado.');
    }

    const patientWithSameCpf = await this.patientsRepository.findByCpf(
      updatePatientDto.cpf,
    );

    if (patientWithSameCpf && patientWithSameCpf.user_id !== patient.user_id) {
      this.logger.error(
        { email: updatePatientDto.email, cpf: updatePatientDto.cpf },
        'Update patient failed: CPF already registered',
      );
      throw new ConflictException('Este CPF já está cadastrado.');
    }

    return await this.dataSource.transaction(async (manager) => {
      const usersDataSource = manager.getRepository(User);
      const patientsDataSource = manager.getRepository(Patient);

      if (updatePatientDto.name !== patient.name) {
        await usersDataSource.update(patient.user_id, {
          name: updatePatientDto.name,
        });
      }

      if (updatePatientDto.email !== patient.email) {
        const existingUser = await usersDataSource.findOne({
          where: { email: updatePatientDto.email },
        });

        if (existingUser) {
          this.logger.error(
            { id: patient.id, email: updatePatientDto.email },
            'Update patient failed: E-mail already registered',
          );
          throw new ConflictException('Este e-mail já está em uso.');
        }

        await usersDataSource.update(patient.user_id, {
          email: updatePatientDto.email,
        });
      }

      const updatedPatient = updatePatientDto;

      Object.assign(patient, updatedPatient);

      await patientsDataSource.save(patient);

      this.logger.log(
        { id: patient.id, userId: patient.user_id, email: patient.email },
        'Patient updated successfully',
      );
    });
  }

  async deactivate(id: string): Promise<void> {
    const patient = await this.patientsRepository.findById(id);

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    if (patient.status == 'inactive') {
      throw new ConflictException('Paciente já está inativo.');
    }

    await this.patientsRepository.deactivate(id);

    this.logger.log(
      { id: patient.id, userId: patient.user_id, email: patient.email },
      'Patient deactivated successfully',
    );
  }
}
