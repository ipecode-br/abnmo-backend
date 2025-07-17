import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { UsersRepository } from '@/app/http/users/users.repository';
import {
  FormType,
  PatientFormsStatus,
  PendingForm,
} from '@/domain/types/form-types';

import { CreatePatientDto } from './patients.dtos';
import { PatientsRepository } from './patients.repository';
import { validateTriagemForm } from './validators/form-validators';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(createPatientDto: CreatePatientDto): Promise<void> {
    const user = await this.usersRepository.findById(createPatientDto.user_id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const patientExists = await this.patientsRepository.findByUserId(
      createPatientDto.user_id,
    );

    if (patientExists) {
      throw new ConflictException('Este paciente já possui um cadastro.');
    }

    const patient = await this.patientsRepository.create(createPatientDto);

    this.logger.log(
      `Paciente cadastrado com sucesso: ${JSON.stringify({ id: patient.id, userId: patient.user_id, timestamp: new Date() })}`,
    );
  }

  async remove(patientId: string): Promise<void> {
    const patient = await this.patientsRepository.findById(patientId);

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    await this.patientsRepository.remove(patient);

    this.logger.log(
      `Paciente removido com sucesso: ${JSON.stringify({ id: patient.id, userId: patient.user_id, timestamp: new Date() })}`,
    );
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

  async deactivatePatient(id: string): Promise<void> {
    const patient = await this.patientsRepository.findById(id);

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado!');
    }

    if (patient.status == 'inactive') {
      throw new ConflictException('Paciente já está inativo.');
    }

    await this.patientsRepository.setPatientInactive(id);

    this.logger.log(
      `Paciente inativado com sucesso: ${JSON.stringify({ id: patient.id, userId: patient.user_id, timestamp: new Date() })}`,
    );
  }
}
