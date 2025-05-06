import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { Patient } from './entities/patient.entity';
import { PatientRepository } from './patient.repository';
import { UserRepository } from 'src/user/user.repository';
import { DiagnosisRepository } from 'src/diagnosis/diagnosis.repository';

@Injectable()
export class PatientService {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly userRepository: UserRepository,
    private readonly diagnosisRepository: DiagnosisRepository,
  ) {}

  async create(createPatientDto: CreatePatientDto): Promise<Patient> {
    const userExists = await this.userRepository.findById(
      createPatientDto.id_usuario,
    );

    if (!userExists) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const diagnosisExists = await this.diagnosisRepository.findById(
      createPatientDto.id_diagnostico,
    );

    if (!diagnosisExists) {
      throw new NotFoundException('Diagnóstico não encontrado.');
    }

    const patientExists = await this.patientRepository.findByIdUsuario(
      createPatientDto.id_usuario,
    );

    if (patientExists) {
      throw new ConflictException('Este paciente já possui um cadastro.');
    }

    const patient = await this.patientRepository.create(createPatientDto);

    return patient;
  }

  async findAll(): Promise<Patient[]> {
    const patients = await this.patientRepository.findAll();

    return patients;
  }

  async findById(id: number): Promise<Patient> {
    const patient = await this.patientRepository.findById(id);

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    return patient;
  }

  async remove(id_paciente: number): Promise<Patient> {
    const patientExists = await this.patientRepository.findById(id_paciente);

    if (!patientExists) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const patient = await this.patientRepository.remove(patientExists);

    return patient;
  }
}
