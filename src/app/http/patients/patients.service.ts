import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DiagnosticsRepository } from '@/app/http/diagnostics/diagnostics.repository';
import { UsersRepository } from '@/app/http/users/users.repository';
import type { Patient } from '@/domain/entities/patient';

import { CreatePatientDto } from './dto/create-patient.dto';
import { FindPatientDto } from './dto/find-patients.dto';
import { PatientsRepository } from './patients.repository';

@Injectable()
export class PatientsService {
  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly diagnosticsRepository: DiagnosticsRepository,
  ) {}

  async create(createPatientDto: CreatePatientDto): Promise<Patient> {
    const userExists = await this.usersRepository.findById(
      createPatientDto.id_user,
    );

    if (!userExists) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const diagnosticExists = await this.diagnosticsRepository.findById(
      createPatientDto.id_diagnostic,
    );

    if (!diagnosticExists) {
      throw new NotFoundException('Diagnóstico não encontrado.');
    }

    const patientExists = await this.patientsRepository.findByIdUsuario(
      createPatientDto.id_user,
    );

    if (patientExists) {
      throw new ConflictException('Este paciente já possui um cadastro.');
    }

    const patient = await this.patientsRepository.create(createPatientDto);

    return patient;
  }

  async findAll(filters: FindPatientDto): Promise<Patient[]> {
    return this.patientsRepository.findAllWithFilters(filters);
  }

  async findById(id: number): Promise<Patient> {
    const patient = await this.patientsRepository.findById(id);

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    return patient;
  }

  async remove(id_paciente: number): Promise<Patient> {
    const patientExists = await this.patientsRepository.findById(id_paciente);

    if (!patientExists) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const patient = await this.patientsRepository.remove(patientExists);

    return patient;
  }
}
