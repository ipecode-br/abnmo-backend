import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import type { PatientOrderByType } from '@/domain/schemas/patient';

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
      query.andWhere(`user.email LIKE :search`, { search: `%${search}%` });
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

  public async findById(id: string): Promise<Patient | null> {
    return await this.patientsRepository.findOne({
      relations: { user: true },
      where: { id },
      select: {
        user: {
          name: true,
          email: true,
          avatar_url: true,
        },
      },
    });
  }

  public async findByUserId(userId: string): Promise<Patient | null> {
    return await this.patientsRepository.findOne({
      relations: { user: true },
      where: { user_id: userId },
      select: {
        user: {
          name: true,
          email: true,
          avatar_url: true,
        },
      },
    });
  }

  public async create(patient: CreatePatientDto): Promise<Patient> {
    const patientCreated = this.patientsRepository.create(patient);
    return await this.patientsRepository.save(patientCreated);
  }

  public async update(patient: Patient): Promise<Patient> {
    return await this.patientsRepository.save(patient);
  }

  public async remove(patient: Patient): Promise<Patient> {
    return await this.patientsRepository.remove(patient);
  }

  public async findByCpf(cpf: string): Promise<Patient | null> {
    return await this.patientsRepository.findOne({
      where: { cpf },
    });
  }

  public async getFormsStatus(): Promise<{
    completeForms: Patient[];
    pendingForms: Patient[];
  }> {
    const allPatients = await this.patientsRepository.find({
      relations: ['user'],
    });

    const completeForms: Patient[] = [];
    const pendingForms: Patient[] = [];

    allPatients.forEach((patient) => {
      const patientComplete = [
        patient.gender,
        patient.date_of_birth,
        patient.city,
        patient.state,
        patient.phone,
        patient.cpf,
        patient.has_disability !== undefined,
        patient.need_legal_assistance !== undefined,
        patient.take_medication !== undefined,
        // patient.diagnostic?.id,
      ].every((field) => field !== undefined && field !== null && field !== '');

      // const supportComplete = patient.support && patient.support.length > 0;

      if (patientComplete) {
        completeForms.push(patient);
      } else {
        pendingForms.push(patient);
      }
    });

    return { completeForms, pendingForms };
  }

  public async getPatientsWithRelations(): Promise<Patient[]> {
    return this.patientsRepository.find({
      relations: {
        user: true,
      }, // Adicione outras relações conforme necessário
    });
  }

  public async deactivate(id: string): Promise<Patient> {
    return this.patientsRepository.save({ id, status: 'inactive' });
  }
}
