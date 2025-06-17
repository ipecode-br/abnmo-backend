import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';

import { CreatePatientDto } from './dto/create-patient.dto';
import { FindPatientDto } from './dto/find-patients.dto';

@Injectable()
export class PatientsRepository {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  public async findAllWithFilters(filters: FindPatientDto): Promise<Patient[]> {
    const {
      status,
      startDate,
      endDate,
      sortBy = 'created_at',
      order = 'ASC',
    } = filters;

    const query = this.patientsRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.apoios', 'apoios')
      .leftJoinAndSelect('patient.diagnostico', 'diagnostico')
      .leftJoinAndSelect('patient.usuario', 'usuario');

    if (status) {
      query.andWhere('patient.status = :status', { status });
    }

    if (startDate && endDate) {
      query.andWhere('patient.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (sortBy) {
      query.orderBy(`patient.${sortBy}`, order);
    }
    return await query.getMany();
  }

  public async findById(id: number): Promise<Patient | null> {
    const patient = await this.patientsRepository.findOne({
      where: {
        id_user: id,
      },
      relations: ['apoios', 'diagnostico', 'usuario'],
    });

    return patient;
  }

  public async findByIdUsuario(id_user: number): Promise<Patient | null> {
    const patient = await this.patientsRepository.findOne({
      where: {
        id_user,
      },
      relations: ['apoios', 'diagnostico', 'usuario'],
    });

    return patient;
  }

  public async create(patient: CreatePatientDto): Promise<Patient> {
    const patientCreated = this.patientsRepository.create(patient);

    const patientSaved = await this.patientsRepository.save(patientCreated);

    return patientSaved;
  }

  public async update(patient: Patient): Promise<Patient> {
    const patientUpdated = await this.patientsRepository.save(patient);

    return patientUpdated;
  }

  public async remove(patient: Patient): Promise<Patient> {
    const patientDeleted = await this.patientsRepository.remove(patient);

    return patientDeleted;
  }
}
