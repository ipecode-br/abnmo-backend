import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  type FindOptionsWhere,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
  type SelectQueryBuilder,
} from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import type {
  PatientOrderBy,
  PatientStatus,
  PatientType,
} from '@/domain/schemas/patient';
import type {
  PatientsStatisticField,
  TotalReferredPatientsByState,
} from '@/domain/schemas/statistics';

import type { GetPatientsByPeriodQuery } from '../statistics/statistics.dtos';
import { CreatePatientDto, FindAllPatientQueryDto } from './patients.dtos';

@Injectable()
export class PatientsRepository {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  public async findAll(
    filters: FindAllPatientQueryDto,
    includePending?: boolean,
  ): Promise<{ patients: PatientType[]; total: number }> {
    const {
      search,
      order,
      orderBy,
      status,
      startDate,
      endDate,
      page,
      perPage,
      all,
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

    if (!all) {
      query.skip((page - 1) * perPage).take(perPage);
    }

    const rawPatients = await query.getMany();

    const patients: PatientType[] = rawPatients.map(
      ({ user, ...patientData }) => ({
        ...patientData,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      }),
    );

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

  public async getTotalPatientsByStatus(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    const queryBuilder = await this.patientsRepository
      .createQueryBuilder('patient')
      .select('COUNT(patient.id)', 'total')
      .where('patient.status != :status', { status: 'pending' })
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
      total: Number(queryBuilder?.total ?? 0),
      active: Number(queryBuilder?.active ?? 0),
      inactive: Number(queryBuilder?.inactive ?? 0),
    };
  }

  public async getPatientsStatisticsByPeriod<T>(
    field: PatientsStatisticField,
    startDate: Date,
    endDate: Date,
    query: GetPatientsByPeriodQuery,
  ): Promise<{ items: T[]; total: number }> {
    const totalQuery = this.patientsRepository
      .createQueryBuilder('patient')
      .select(`COUNT(DISTINCT patient.${field})`, 'total')
      .where('patient.created_at BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });

    const totalResult = await totalQuery.getRawOne<{ total: string }>();
    const total = Number(totalResult?.total ?? 0);

    const queryBuilder = this.patientsRepository
      .createQueryBuilder('patient')
      .select(`patient.${field}`, field)
      .addSelect('COUNT(patient.id)', 'total')
      .where('patient.created_at BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy(`patient.${field}`)
      .orderBy('total', query.order)
      .limit(query.limit);

    if (query.withPercentage) {
      queryBuilder.addSelect(
        'ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 1)',
        'percentage',
      );
    }

    const items = await queryBuilder.getRawMany<T>();

    return { items, total };
  }

  public async getTotalPatients(
    input: { status?: PatientStatus; startDate?: Date; endDate?: Date } = {},
  ): Promise<number> {
    const { status, startDate, endDate } = input;

    const where: FindOptionsWhere<Patient> = {
      status: status ?? Not('pending'),
    };

    if (startDate && !endDate) {
      where.created_at = MoreThanOrEqual(startDate);
    }

    if (endDate && !startDate) {
      where.created_at = LessThanOrEqual(endDate);
    }

    if (startDate && endDate) {
      where.created_at = Between(startDate, endDate);
    }

    return await this.patientsRepository.count({ where });
  }

  public async getTotalReferredPatients(
    input: { startDate?: Date; endDate?: Date } = {},
  ): Promise<number> {
    const { startDate, endDate } = input;

    const where: FindOptionsWhere<Patient> = {
      referrals: { id: Not(IsNull()) },
    };

    if (startDate && !endDate) {
      where.created_at = MoreThanOrEqual(startDate);
    }

    if (endDate && !startDate) {
      where.created_at = LessThanOrEqual(endDate);
    }

    if (startDate && endDate) {
      where.created_at = Between(startDate, endDate);
    }

    return await this.patientsRepository.count({ where });
  }

  public async getTotalReferredPatientsByState(
    input: { startDate?: Date; endDate?: Date; limit?: number } = {},
  ): Promise<{ states: TotalReferredPatientsByState[]; total: number }> {
    const { startDate, endDate, limit = 10 } = input;

    const createQueryBuilder = (): SelectQueryBuilder<Patient> => {
      return this.patientsRepository
        .createQueryBuilder('patient')
        .innerJoin('patient.referrals', 'referral')
        .where('referral.referred_to IS NOT NULL')
        .andWhere('referral.referred_to != :empty', { empty: '' });
    };

    function getQueryBuilderWithFilters(
      queryBuilder: SelectQueryBuilder<Patient>,
    ) {
      if (startDate && endDate) {
        queryBuilder.andWhere('referral.date BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        });
      }

      return queryBuilder;
    }

    const stateListQuery = getQueryBuilderWithFilters(
      createQueryBuilder()
        .select('patient.state', 'state')
        .addSelect('COUNT(DISTINCT patient.id)', 'total')
        .groupBy('patient.state')
        .orderBy('COUNT(DISTINCT patient.id)', 'DESC')
        .limit(limit),
    );

    const totalStatesQuery = getQueryBuilderWithFilters(
      createQueryBuilder().select('COUNT(DISTINCT patient.state)', 'total'),
    );

    const [states, totalResult] = await Promise.all([
      stateListQuery.getRawMany<TotalReferredPatientsByState>(),
      totalStatesQuery.getRawOne<{ total: string }>(),
    ]);

    return {
      states,
      total: Number(totalResult?.total || 0),
    };
  }
}
