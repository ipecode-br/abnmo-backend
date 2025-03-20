import { InjectRepository } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { Repository } from 'typeorm';
import { CreatePatientDto } from './dto/create-patient.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PatientRepository {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  public async findAll(): Promise<Patient[]> {
    const patients = await this.patientRepository.find();

    return patients;
  }

  public async findById(id: number): Promise<Patient | null> {
    const patient = await this.patientRepository.findOne({
      where: {
        id_paciente: id,
      },
    });

    return patient;
  }

  public async findByIdUsuario(id_usuario: number): Promise<Patient | null> {
    const patient = await this.patientRepository.findOne({
      where: {
        id_usuario,
      },
    });

    return patient;
  }

  public async create(patient: CreatePatientDto): Promise<Patient> {
    const patientCreated = this.patientRepository.create(patient);

    const patientSaved = await this.patientRepository.save(patientCreated);

    return patientSaved;
  }

  public async update(patient: Patient): Promise<Patient> {
    const patientUpdated = await this.patientRepository.save(patient);

    return patientUpdated;
  }

  public async remove(patient: Patient): Promise<Patient> {
    const patientDeleted = await this.patientRepository.remove(patient);

    return patientDeleted;
  }
}
