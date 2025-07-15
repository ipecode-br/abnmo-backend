import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PatientSupport } from '@/domain/entities/patient-support';

import {
  CreatePatientSupportDto,
  UpdatePatientSupportDto,
} from './dto/create-patient-support.dto';
import { PatientSupportsRepository } from './patient-supports.repository';

@Injectable()
export class PatientSupportsService {
  private readonly logger = new Logger(PatientSupportsService.name);

  constructor(
    private readonly patientSupportsRepository: PatientSupportsRepository,
  ) {}

  async create(
    patientId: string,
    createPatientSupportDto: CreatePatientSupportDto,
  ): Promise<PatientSupport> {
    const patientExists =
      await this.patientSupportsRepository.findById(patientId);

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
      `Contato registrado com sucesso: ${JSON.stringify({ id: patientSupport.id, patientId: patientSupport.patient_id, timestamp: new Date() })}`,
    );

    return patientSupport;
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
