import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PatientSupport } from '@/domain/entities/patient-support';

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

    if (!patientSupport) {
      throw new InternalServerErrorException(
        'Não foi possível registrar o contato de apoio.',
      );
    }

    this.logger.log(
      { id: patientSupport.id, patientId: patientSupport.patient_id },
      'Contato de apoio registrado com sucesso',
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
  ): Promise<void> {
    const patientSupport = await this.patientSupportsRepository.findById(id);

    if (!patientSupport) {
      throw new NotFoundException('Contato de apoio não encontrado.');
    }

    Object.assign(patientSupport, updatePatientsSupportDto);

    await this.patientSupportsRepository.update(patientSupport);

    this.logger.log(
      { id: patientSupport.id, patientId: patientSupport.patient_id },
      'Contato de apoio atualizado com sucesso',
    );
  }

  async remove(id: string): Promise<void> {
    const patientSupport = await this.patientSupportsRepository.findById(id);

    if (!patientSupport) {
      throw new NotFoundException('Contato de apoio não encontrado.');
    }

    await this.patientSupportsRepository.remove(patientSupport);

    this.logger.log(
      { id: patientSupport.id, patientId: patientSupport.patient_id },
      'Contato de apoio atualizado com sucesso',
    );
  }
}
