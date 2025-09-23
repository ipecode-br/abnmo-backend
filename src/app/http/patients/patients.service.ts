import {
  BadRequestException,
  ConflictException,
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

import { CreatePatientDto, UpdatePatientDto } from './patients.dtos';
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

  async create(createPatientDto: CreatePatientDto): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      const usersRepository = manager.getRepository(User);
      const patientsRepository = manager.getRepository(Patient);
      const patientsSupportRepository = manager.getRepository(PatientSupport);

      let user: User | null = null;

      if (!createPatientDto.user_id) {
        const { email, name } = createPatientDto;

        if (!email || !name) {
          throw new BadRequestException(
            'E-mail e nome são obrigatórios quando o ID do usuário não for fornecido.',
          );
        }

        const existingUser = await usersRepository.findOne({
          where: { email },
        });

        if (existingUser) {
          throw new ConflictException('Este e-mail já está em uso.');
        }

        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword =
          await this.cryptographyService.createHash(randomPassword);

        const newUser = usersRepository.create({
          email,
          name,
          password: hashedPassword,
        });

        user = await usersRepository.save(newUser);
      } else {
        const registeredUser = await usersRepository.findOne({
          where: { id: createPatientDto.user_id },
        });
        user = registeredUser;
      }

      if (!user) {
        throw new NotFoundException('Usuário não encontrado.');
      }

      const patientExists = await patientsRepository.findOne({
        where: { user_id: user.id },
      });

      if (patientExists) {
        throw new ConflictException('Este paciente já possui um cadastro.');
      }

      const patientWithSameCpf = await patientsRepository.findOne({
        where: { cpf: createPatientDto.cpf },
      });

      if (patientWithSameCpf) {
        this.logger.error(
          {
            userId: createPatientDto.user_id,
            email: createPatientDto.email,
            cpf: createPatientDto.cpf,
          },
          'Patient registration failed: CPF already registered',
        );
        throw new ConflictException('Este CPF já está cadastrado.');
      }

      const patient = patientsRepository.create({
        ...createPatientDto,
        user_id: user.id,
      });

      const savedPatient = await patientsRepository.save(patient);

      if (createPatientDto.supports.length > 0) {
        const patientSupports = createPatientDto.supports.map((support) =>
          patientsSupportRepository.create({
            name: support.name,
            phone: support.phone,
            kinship: support.kinship,
            patient_id: savedPatient.id,
          }),
        );

        await patientsSupportRepository.save(patientSupports);
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
    return await this.dataSource.transaction(async (manager) => {
      const usersRepository = manager.getRepository(User);
      const patientsRepository = manager.getRepository(Patient);

      const patient = await patientsRepository.findOne({
        where: { id },
        relations: { user: true },
      });

      if (!patient) {
        throw new NotFoundException('Paciente não encontrado.');
      }

      if (updatePatientDto.cpf && updatePatientDto.cpf !== patient.cpf) {
        const patientWithSameCpf = await patientsRepository.findOne({
          where: { cpf: updatePatientDto.cpf },
        });

        if (patientWithSameCpf) {
          this.logger.error(
            {
              id: patient.id,
              userId: patient.user_id,
              email: patient.user.email,
            },
            'Patient update failed: CPF already registered',
          );

          throw new ConflictException('Este CPF já está cadastrado.');
        }
      }

      if (
        updatePatientDto.email &&
        updatePatientDto.email !== patient.user.email
      ) {
        const existingUser = await usersRepository.findOne({
          where: { email: updatePatientDto.email },
        });

        if (existingUser) {
          throw new ConflictException('Este e-mail já está em uso.');
        }
      }

      if (updatePatientDto.name || updatePatientDto.email) {
        const userUpdated: Partial<User> = {};
        if (updatePatientDto.name) userUpdated.name = updatePatientDto.name;
        if (updatePatientDto.email) userUpdated.email = updatePatientDto.email;

        await usersRepository.update(patient.user_id, userUpdated);
      }

      const patientUpdate = updatePatientDto;
      delete patientUpdate.name;
      delete patientUpdate.email;

      Object.assign(patient, patientUpdate);

      await patientsRepository.save(patient);

      this.logger.log(
        { id: patient.id, userId: patient.user_id, email: patient.user.email },
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
