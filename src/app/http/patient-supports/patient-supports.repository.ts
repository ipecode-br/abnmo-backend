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

  public async findAll(): Promise<PatientSupport[]> {
    const patientSupports = await this.patientSupportsRepository.find({
      relations: ['paciente'],
    });

    return patientSupports;
  }

  public async findById(id: number): Promise<PatientSupport | null> {
    const patientSupport = await this.patientSupportsRepository.findOne({
      where: {
        id_support: id,
      },
      relations: ['paciente'],
    });

    return patientSupport;
  }

  public async create(
    support: CreatePatientSupportDto,
  ): Promise<PatientSupport> {
    const patientSupportCreated =
      this.patientSupportsRepository.create(support);

    const patientSupportSaved = await this.patientSupportsRepository.save(
      patientSupportCreated,
    );

    return patientSupportSaved;
  }

  public async update(support: PatientSupport): Promise<PatientSupport> {
    const patientSupportUpdated =
      await this.patientSupportsRepository.save(support);

    return patientSupportUpdated;
  }

  public async remove(support: PatientSupport): Promise<PatientSupport> {
    const patientSupportDeleted =
      await this.patientSupportsRepository.remove(support);

    return patientSupportDeleted;
  }
}
