import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';

import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsRepository {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  public async findAll(): Promise<Patient[]> {
    const patients = await this.patientsRepository.find({
      relations: ['user'],
    });

    return patients;
  }

  public async findById(id: string): Promise<Patient | null> {
    const patient = await this.patientsRepository.findOne({
      where: {
        user_id: id,
      },
      relations: ['user'],
    });

    return patient;
  }

  public async findByIdUsuario(user_id: string): Promise<Patient | null> {
    const patient = await this.patientsRepository.findOne({
      where: {
        user_id,
      },
      relations: ['user'],
    });

    return patient;
  }

  public async create(patient: CreatePatientDto): Promise<Patient> {
    const patientCreated = this.patientsRepository.create({
      ...patient,
      url_photo: patient.url_photo ?? null,
      disability_desc: patient.disability_desc ?? null,
      medication_desc: patient.medication_desc ?? null,
      // diagnostic: { id: patient.id_diagnostic },
      // filename_diagnostic: patient.filename_diagnostic ?? null,
    });

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
        patient.url_photo,
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
}
