import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { UsersRepository } from '@/app/http/users/users.repository';
import type { GetPatientsTotalResponseSchema } from '@/domain/schemas/patient';
import type { UserSchema } from '@/domain/schemas/user';
import {
  FormType,
  PatientFormsStatus,
  PendingForm,
} from '@/domain/types/form-types';

import { UsersService } from '../users/users.service';
import { CreatePatientDto, UpdatePatientDto } from './patients.dtos';
import { PatientsRepository } from './patients.repository';
import { validateTriagemForm } from './validators/form-validators';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
  ) {}

  async create(createPatientDto: CreatePatientDto): Promise<void> {
    let user: UserSchema | null = null;

    if (!createPatientDto.user_id) {
      const { email, name } = createPatientDto;

      if (!email || !name) {
        throw new BadRequestException(
          'E-mail e nome são obrigatórios quando o ID do usuário não for fornecido.',
        );
      }

      const randomPassword = Math.random().toString(36).slice(-8);
      const newUser = await this.usersService.create({
        email,
        name,
        password: randomPassword,
      });
      user = newUser;
    }

    if (createPatientDto.user_id) {
      const registeredUser = await this.usersRepository.findById(
        createPatientDto.user_id,
      );
      user = registeredUser;
    }

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const patientExists = await this.patientsRepository.findByUserId(user.id);

    if (patientExists) {
      throw new ConflictException('Este paciente já possui um cadastro.');
    }

    const patientData = {
      ...createPatientDto,
      user_id: user.id,
    };

    const patient = await this.patientsRepository.create(patientData);

    this.logger.log(
      { id: patient.id, userId: patient.user_id, email: user.email },
      'Paciente cadastrado com sucesso',
    );
  }

  async update(id: string, updatePatientDto: UpdatePatientDto): Promise<void> {
    const patient = await this.patientsRepository.findById(id);

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    if (updatePatientDto.cpf && updatePatientDto.cpf !== patient.cpf) {
      const patientWithSameCpf = await this.patientsRepository.findByCpf(
        updatePatientDto.cpf,
      );

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

    Object.assign(patient, updatePatientDto);

    await this.patientsRepository.update(patient);

    this.logger.log(
      { id: patient.id, userId: patient.user_id, email: patient.user.email },
      'Patient updated successfully',
    );
  }

  async deactivatePatient(id: string): Promise<void> {
    const patient = await this.patientsRepository.findById(id);

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    if (patient.status == 'inactive') {
      throw new ConflictException('Paciente já está inativo.');
    }

    await this.patientsRepository.deactivate(id);

    this.logger.log(
      { id: patient.id, userId: patient.user_id },
      'Paciente inativado com sucesso',
    );
  }

  async remove(patientId: string): Promise<void> {
    const patient = await this.patientsRepository.findById(patientId);

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    await this.patientsRepository.remove(patient);

    this.logger.log(
      { id: patient.id, userId: patient.user_id },
      'Paciente removido com sucesso',
    );
  }

  async getPatientsTotal(): Promise<GetPatientsTotalResponseSchema['data']> {
    return await this.patientsRepository.getPatientsTotal();
  }

  async getPatientFormsStatus(): Promise<PatientFormsStatus[]> {
    const patients = await this.patientsRepository.getPatientsWithRelations();

    return patients.map((patient) => {
      const pendingForms: PendingForm[] = [];
      const completedForms: FormType[] = [];

      // Validação do formulário de triagem
      const triagemStatus = validateTriagemForm(patient);
      if (triagemStatus) {
        pendingForms.push(triagemStatus);
      } else {
        completedForms.push('triagem');
      }

      return {
        patientId: Number(patient.cpf),
        patientName: patient.user?.name || 'Não informado',
        pendingForms,
        completedForms,
      };
    });
  }
}
