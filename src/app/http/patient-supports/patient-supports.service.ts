import { Injectable, NotFoundException } from '@nestjs/common';

import { PatientSupport } from '@/domain/entities/patient-support';

import {
  CreatePatientSupportDto,
  UpdatePatientSupportDto,
} from './dto/create-patient-support.dto';
import { PatientSupportsRepository } from './patient-supports.repository';

@Injectable()
export class PatientSupportsService {
  constructor(
    private readonly patientSupportsRepository: PatientSupportsRepository,
  ) {}

  async create(
    patientId: string,
    createDto: CreatePatientSupportDto,
  ): Promise<PatientSupport> {
    const patientExists =
      await this.patientSupportsRepository.findById(patientId);

    if (!patientExists) throw new NotFoundException('Paciente não encontrado.');

    return this.patientSupportsRepository.create({
      ...createDto,
      patient_id: patientId,
    });
  }

  async update(
    id: string,
    updatePatientsSupportDto: UpdatePatientSupportDto,
  ): Promise<PatientSupport> {
    const supportExists = await this.patientSupportsRepository.findById(id);

    if (!supportExists)
      throw new NotFoundException('Apoio do paciente não encontrado.');

    Object.assign(supportExists, updatePatientsSupportDto);

    return this.patientSupportsRepository.update(supportExists);
  }
  async remove(id: string): Promise<PatientSupport> {
    const support = await this.patientSupportsRepository.findById(id);

    if (!support)
      throw new NotFoundException(
        `Apoio do paciente com ID ${id} não encontrado.`,
      );

    return this.patientSupportsRepository.remove(support);
  }
}
