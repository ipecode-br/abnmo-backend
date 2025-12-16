import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PatientSupport } from '@/domain/entities/patient-support';

import type { AuthUserDto } from '../auth/auth.dtos';
import { PatientsRepository } from '../patients/patients.repository';
import {
  CreatePatientSupportDto,
  UpdatePatientSupportDto,
} from './patient-supports.dtos';
import { PatientSupportsRepository } from './patient-supports.repository';

@Injectable()
export class PatientSupportsService {
  private readonly logger = new Logger(PatientSupportsService.name);

  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly patientSupportsRepository: PatientSupportsRepository,
  ) {}

  async create(
    createPatientSupportDto: CreatePatientSupportDto,
    patientId: string,
  ): Promise<PatientSupport> {
    const patientExists = await this.patientsRepository.findById(patientId);

    if (!patientExists) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const patientSupport = await this.patientSupportsRepository.create({
      ...createPatientSupportDto,
      patient_id: patientId,
    });

    this.logger.log(
      { id: patientSupport.id, patientId: patientSupport.patient_id },
      'Support network created successfully',
    );

    return patientSupport;
  }

  async findAllByPatientId(patientId: string): Promise<PatientSupport[]> {
    const patientExists = await this.patientsRepository.findById(patientId);

    if (!patientExists) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    return await this.patientSupportsRepository.findAllByPatientId(patientId);
  }

  async update(
    id: string,
    updatePatientsSupportDto: UpdatePatientSupportDto,
    authUser: AuthUserDto,
  ): Promise<void> {
    const patientSupport = await this.patientSupportsRepository.findById(id);

    if (!patientSupport) {
      throw new NotFoundException('Contato de apoio não encontrado.');
    }

    if (
      authUser.role === 'patient' &&
      authUser.id !== patientSupport.patient_id
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este contato de apoio.',
      );
    }

    Object.assign(patientSupport, updatePatientsSupportDto);

    await this.patientSupportsRepository.update(patientSupport);

    this.logger.log(
      { id: patientSupport.id, patientId: patientSupport.patient_id },
      'Support network updated successfully',
    );
  }

  async remove(id: string, authUser: AuthUserDto): Promise<void> {
    const patientSupport = await this.patientSupportsRepository.findById(id);

    if (!patientSupport) {
      throw new NotFoundException('Contato de apoio não encontrado.');
    }

    if (
      authUser.role === 'patient' &&
      authUser.id !== patientSupport.patient_id
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para remover este contato de apoio.',
      );
    }

    await this.patientSupportsRepository.remove(patientSupport);

    this.logger.log(
      { id: patientSupport.id, patientId: patientSupport.patient_id },
      'Support network removed successfully',
    );
  }
}
