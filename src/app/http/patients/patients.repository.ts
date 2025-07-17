import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';

import { CreatePatientDto } from './patients.dtos';

@Injectable()
export class PatientsRepository {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  public async findAll(): Promise<Patient[]> {
    return await this.patientsRepository.find({
      relations: { user: true },
      select: {
        user: {
          name: true,
          email: true,
          avatar_url: true,
        },
      },
    });
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
      relations: ['user'], // Adicione outras relações conforme necessário
    });
  }

  public async setPatientInactive(id: string): Promise<Patient> {
    return this.patientsRepository.save({
      id,
      status: 'inactive',
    });
  }
}
