import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import type { PatientOrderBy } from '@/domain/enums/patients';
import type { PatientResponse } from '@/domain/schemas/patient/responses';

import { CreatePatientDto, GetPatientsQuery } from './patients.dtos';

@Injectable()
export class PatientsRepository {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  public async findAll(
    filters: GetPatientsQuery,
    includePending?: boolean,
  ): Promise<{ patients: PatientResponse[]; total: number }> {
    const {
      search,
      order,
      orderBy,
      status,
      startDate,
      endDate,
      page,
      perPage,
    } = filters;

    const ORDER_BY: Record<PatientOrderBy, string> = {
      name: 'user.name',
      email: 'user.email',
      status: 'patient.status',
      date: 'patient.created_at',
    };

    const query = this.patientsRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.user', 'user')
      .select(['patient', 'user.name', 'user.email', 'user.avatar_url']);

    if (search) {
      query.andWhere(`user.name LIKE :search`, { search: `%${search}%` });
      query.orWhere(`user.email LIKE :search`, { search: `%${search}%` });
    }

    if (status) {
      query.andWhere('patient.status = :status', { status });
    }

    if (!status && !includePending) {
      query.andWhere("patient.status != 'pending'");
    }

    if (startDate && endDate) {
      query.andWhere('patient.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (startDate && !endDate) {
      query.andWhere('patient.created_at >= :startDate', { startDate });
    }

    const total = await query.getCount();

    query.orderBy(ORDER_BY[orderBy], order);

    query.skip((page - 1) * perPage).take(perPage);
    const rawPatients = await query.getMany();

    const patients: PatientResponse[] = rawPatients.map(
      ({ ...patientData }) => ({
        id: patientData.id,
        name: patientData.name,
        email: patientData.email,
        status: patientData.status,
        avatar_url: patientData.avatar_url,
        phone: patientData.phone,
        created_at: patientData.created_at,
      }),
    );

    return { patients, total };
  }

  public async findById(id: string): Promise<Patient | null> {
    const patient = await this.patientsRepository.findOne({
      relations: { supports: true },
      where: { id },
      select: {
        supports: { id: true, name: true, phone: true, kinship: true },
      },
    });

    return patient;
  }

  public async findByEmail(email: string): Promise<Patient | null> {
    return await this.patientsRepository.findOne({ where: { email } });
  }

  public async findByCpf(cpf: string): Promise<Patient | null> {
    return await this.patientsRepository.findOne({ where: { cpf } });
  }

  public async create(patient: CreatePatientDto): Promise<Patient> {
    return await this.patientsRepository.save(patient);
  }

  public async update(patient: Patient): Promise<Patient> {
    return await this.patientsRepository.save(patient);
  }

  public async deactivate(id: string): Promise<Patient> {
    return this.patientsRepository.save({ id, status: 'inactive' });
  }
}
