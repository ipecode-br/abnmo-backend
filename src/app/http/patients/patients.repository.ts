import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';

import { CreatePatientDto } from './dto/create-patient.dto';
import { FindPatientDto } from './dto/find-patient.dto';

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
      .leftJoinAndSelect('patient.supports', 'support')
      .leftJoinAndSelect('patient.diagnostic', 'diagnostic')
      .leftJoinAndSelect('patient.user', 'user');

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
      relations: ['support', 'diagnostic', 'user'],
    });

    return patient;
  }

  public async findByIdUsuario(id_user: number): Promise<Patient | null> {
    const patient = await this.patientsRepository.findOne({
      where: {
        id_user,
      },
      relations: ['support', 'diagnostic', 'user'],
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

  public async getFormsStatus(): Promise<{
    completeForms: Patient[];
    pendingForms: Patient[];
  }> {
    const allPatients = await this.patientsRepository.find({
      relations: ['support', 'user'],
    });

    const completeForms: Patient[] = [];
    const pendingForms: Patient[] = [];

    allPatients.forEach((patient) => {
      const patientComplete = [
        patient.desc_gender,
        patient.birth_of_date,
        patient.city,
        patient.state,
        patient.whatsapp,
        patient.cpf,
        patient.url_photo,
        patient.have_disability !== undefined,
        patient.need_legal_help !== undefined,
        patient.use_medicine !== undefined,
        patient.id_diagnostic,
      ].every((field) => field !== undefined && field !== null && field !== '');

      const supportComplete = patient.support && patient.support.length > 0;

      if (patientComplete && supportComplete) {
        completeForms.push(patient);
      } else {
        pendingForms.push(patient);
      }
    });

    return { completeForms, pendingForms };
  }

  public async getPatientsWithRelations(): Promise<Patient[]> {
    return this.patientsRepository.find({
      relations: ['user', 'support'], // Adicione outras relações conforme necessário
    });
  }
}
