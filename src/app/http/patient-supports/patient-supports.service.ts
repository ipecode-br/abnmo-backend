import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import { PatientSupport } from '@/domain/entities/patient-support';

import type { AuthUserDto } from '../auth/auth.dtos';
import {
  CreatePatientSupportDto,
  UpdatePatientSupportDto,
} from './patient-supports.dtos';
import { PatientSupportsRepository } from './patient-supports.repository';

@Injectable()
export class PatientSupportsService {
  private readonly logger = new Logger(PatientSupportsService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly patientSupportsRepository: PatientSupportsRepository,
  ) {}

  async create(
    createPatientSupportDto: CreatePatientSupportDto,
    patientId: string,
  ): Promise<PatientSupport> {
    const patientExists = await this.patientsRepository.findOne({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patientExists) {
      throw new NotFoundException('Patient not found.');
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
    const patientExists = await this.patientsRepository.findOne({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patientExists) {
      throw new NotFoundException('Patient not found.');
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
      throw new NotFoundException('Support network not found.');
    }

    if (
      authUser.role === 'patient' &&
      authUser.id !== patientSupport.patient_id
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this support network.',
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
      throw new NotFoundException('Support network not found.');
    }

    if (
      authUser.role === 'patient' &&
      authUser.id !== patientSupport.patient_id
    ) {
      throw new ForbiddenException(
        'You do not have permission to remove this support network.',
      );
    }

    await this.patientSupportsRepository.remove(patientSupport);

    this.logger.log(
      { id: patientSupport.id, patientId: patientSupport.patient_id },
      'Support network removed successfully',
    );
  }
}
