import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import type { PatientOrderByType, PatientType } from '@/domain/schemas/patient';
import type { OrderType } from '@/domain/schemas/query';
import type {
  GetPatientsTotalResponseSchema,
  PatientsStatisticQueryType,
} from '@/domain/schemas/statistics';

import { CreatePatientDto, FindAllPatientQueryDto } from './patients.dtos';

@Injectable()
export class PatientsRepository {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  public async findAll(
    filters: FindAllPatientQueryDto,
  ): Promise<{ patients: Patient[]; total: number }> {
    const { search, order, orderBy, status, startDate, endDate, page } =
      filters;

    const PAGE_SIZE = 10;
    const ORDER_BY: Record<PatientOrderByType, string> = {
      name: 'user.name',
      status: 'patient.status',
      date: 'patient.created_at',
    };

    const query = this.patientsRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.user', 'user')
      .select([
        'patient',
        'user.id',
        'user.name',
        'user.email',
        'user.avatar_url',
      ]);

    if (search) {
      query.andWhere(`user.name LIKE :search`, { search: `%${search}%` });
      query.orWhere(`user.email LIKE :search`, { search: `%${search}%` });
    }

    if (status) {
      query.andWhere('patient.status = :status', { status });
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
    query.skip((page - 1) * PAGE_SIZE).take(PAGE_SIZE);

    const patients = await query.getMany();

    return { patients, total };
  }

  public async findById(id: string): Promise<PatientType | null> {
    const patient = await this.patientsRepository.findOne({
      relations: { user: true, supports: true },
      where: { id },
      select: {
        user: { name: true, email: true, avatar_url: true },
        supports: { id: true, name: true, phone: true, kinship: true },
      },
    });

    if (!patient) {
      return null;
    }

    const { user, ...patientData } = patient;

    return {
      ...patientData,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
    };
  }

  public async findByUserId(userId: string): Promise<PatientType | null> {
    const patient = await this.patientsRepository.findOne({
      relations: { user: true, supports: true },
      where: { user_id: userId },
      select: {
        user: { name: true, email: true, avatar_url: true },
        supports: { id: true, name: true, phone: true, kinship: true },
      },
    });

    if (!patient) {
      return null;
    }

    const { user, ...patientData } = patient;

    return {
      ...patientData,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
    };
  }

  public async findByEmail(email: string): Promise<Patient | null> {
    return await this.patientsRepository.findOne({
      select: { user: true },
      where: { user: { email } },
    });
  }

  public async findByCpf(cpf: string): Promise<Patient | null> {
    return await this.patientsRepository.findOne({ where: { cpf } });
  }

  public async create(patient: CreatePatientDto): Promise<Patient> {
    const patientCreated = this.patientsRepository.create(patient);
    return await this.patientsRepository.save(patientCreated);
  }

  public async update(patient: Patient): Promise<Patient> {
    return await this.patientsRepository.save(patient);
  }

  public async deactivate(id: string): Promise<Patient> {
    return this.patientsRepository.save({ id, status: 'inactive' });
  }

  public async getPatientsTotal(): Promise<
    GetPatientsTotalResponseSchema['data']
  > {
    const raw = await this.patientsRepository
      .createQueryBuilder('patient')
      .select('COUNT(*)', 'total')
      .addSelect(
        `SUM(CASE WHEN patient.status = 'active' THEN 1 ELSE 0 END)`,
        'active',
      )
      .addSelect(
        `SUM(CASE WHEN patient.status = 'inactive' THEN 1 ELSE 0 END)`,
        'inactive',
      )
      .getRawOne<{ total: string; active: string; inactive: string }>();

    return {
      total: Number(raw?.total ?? 0),
      active: Number(raw?.active ?? 0),
      inactive: Number(raw?.inactive ?? 0),
    };
  }

  public async getPatientsStatisticsByPeriod<T>(
    query: PatientsStatisticQueryType,
    startDate: Date,
    endDate: Date,
    order: OrderType = 'DESC',
  ): Promise<T[]> {
    const results = await this.patientsRepository
      .createQueryBuilder('patient')
      .select(`patient.${query}`, query)
      .addSelect('COUNT(*)', 'total')
      .where('patient.created_at BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy(`patient.${query}`)
      .orderBy(`total`, order)
      .getRawMany<T>();

    return results;
  }
}
