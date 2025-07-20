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
      `Contato de apoio registrado com sucesso: ${JSON.stringify({ id: patientSupport.id, patientId: patientSupport.patient_id, timestamp: new Date() })}`,
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
  ): Promise<PatientSupport> {
    const patientSupport = await this.patientSupportsRepository.findById(id);

    if (!patientSupport) {
      throw new NotFoundException('Contato de apoio não encontrado.');
    }

    Object.assign(patientSupport, updatePatientsSupportDto);

    const patientSupportUpdated =
      await this.patientSupportsRepository.update(patientSupport);

    this.logger.log(
      `Contato de apoio atualizado com sucesso: ${JSON.stringify({ id: patientSupportUpdated.id, patientId: patientSupportUpdated.patient_id, timestamp: new Date() })}`,
    );

    return patientSupportUpdated;
  }

  async remove(id: string): Promise<void> {
    const patientSupport = await this.patientSupportsRepository.findById(id);

    if (!patientSupport) {
      throw new NotFoundException('Contato de apoio não encontrado.');
    }

    await this.patientSupportsRepository.remove(patientSupport);

    this.logger.log(
      `Contato de apoio removido com sucesso: ${JSON.stringify({ id: patientSupport.id, patientId: patientSupport.patient_id, timestamp: new Date() })}`,
    );
  }
}
