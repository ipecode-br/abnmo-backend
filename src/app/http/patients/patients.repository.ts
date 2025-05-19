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
      relations: ['apoios', 'diagnostico', 'usuario'],
    });

    return patients;
  }

  public async findById(id: number): Promise<Patient | null> {
    const patient = await this.patientsRepository.findOne({
      where: {
        id_paciente: id,
      },
      relations: ['apoios', 'diagnostico', 'usuario'],
    });

    return patient;
  }

  public async findByIdUsuario(id_usuario: number): Promise<Patient | null> {
    const patient = await this.patientsRepository.findOne({
      where: {
        id_usuario,
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
