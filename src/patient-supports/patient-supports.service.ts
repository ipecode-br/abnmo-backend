import { Injectable, NotFoundException } from '@nestjs/common';

import { PatientsRepository } from '@/patients/patients.repository';

import { CreatePatientSupportDto } from './dto/create-patient-support.dto';
import { PatientSupportsRepository } from './patient-supports.repository';

@Injectable()
export class PatientSupportsService {
  constructor(
    private readonly patientSupportsRepository: PatientSupportsRepository,
    private readonly patientsRepository: PatientsRepository,
  ) {}

  public async create(createPatientSupportDto: CreatePatientSupportDto) {
    const patientExists = await this.patientsRepository.findById(
      createPatientSupportDto.id_paciente,
    );

    if (!patientExists) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const patientSupport = await this.patientSupportsRepository.create(
      createPatientSupportDto,
    );

    return patientSupport;
  }

  public async findAll() {
    const patientSupports = await this.patientSupportsRepository.findAll();

    return patientSupports;
  }

  public async findById(id: number) {
    const patientSupports = await this.patientSupportsRepository.findById(id);

    if (!patientSupports) {
      throw new NotFoundException('Apoio não encontrado.');
    }

    return patientSupports;
  }

  public async remove(id: number) {
    const supportExists = await this.patientSupportsRepository.findById(id);

    if (!supportExists) {
      throw new NotFoundException('Apoio não encontrado.');
    }

    const patientSupports =
      await this.patientSupportsRepository.remove(supportExists);

    return patientSupports;
  }
}
