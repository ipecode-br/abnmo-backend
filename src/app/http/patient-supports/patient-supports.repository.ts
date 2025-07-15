import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PatientSupport } from '@/domain/entities/patient-support';

import { CreatePatientSupportDto } from './dto/create-patient-support.dto';

@Injectable()
export class PatientSupportsRepository {
  constructor(
    @InjectRepository(PatientSupport)
    private readonly patientSupportsRepository: Repository<PatientSupport>,
  ) {}

  public async findById(id: string): Promise<PatientSupport | null> {
    return await this.patientSupportsRepository.findOne({
      where: { id: id },
    });
  }

  public async findAllByPatientId(
    patientId: string,
  ): Promise<PatientSupport[]> {
    return await this.patientSupportsRepository.find({
      where: { patient_id: patientId },
    });
  }

  public async create(
    createPatientSupportDto: CreatePatientSupportDto,
  ): Promise<PatientSupport> {
    const patientSupportCreated = this.patientSupportsRepository.create(
      createPatientSupportDto,
    );

    return await this.patientSupportsRepository.save(patientSupportCreated);
  }

  public async update(patientSupport: PatientSupport): Promise<PatientSupport> {
    return await this.patientSupportsRepository.save(patientSupport);
  }

  public async remove(patientSupport: PatientSupport): Promise<PatientSupport> {
    return await this.patientSupportsRepository.remove(patientSupport);
  }
}
