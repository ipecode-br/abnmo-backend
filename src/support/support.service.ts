import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSupportDto } from './dto/create-support.dto';
import { SupportRepository } from './support.repository';
import { PatientRepository } from 'src/patient/patient.repository';

@Injectable()
export class SupportService {
  constructor(
    private readonly supportRepository: SupportRepository,
    private readonly patientRepository: PatientRepository,
  ) {}

  public async create(createSupportDto: CreateSupportDto) {
    const patientExists = await this.patientRepository.findById(
      createSupportDto.id_paciente,
    );

    if (!patientExists) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const supportExists = await this.supportRepository.findByName(
      createSupportDto.nome_apoio,
      createSupportDto.whatsapp,
    );

    if (!supportExists) {
      const support = await this.supportRepository.create(createSupportDto);

      return support;
    }

    const samePatient = supportExists.pacientes.some(
      (patient) => patient.id_paciente === createSupportDto.id_paciente,
    );

    if (samePatient) {
      throw new ConflictException('Apoio já cadastrado para esse paciente.');
    }

    // é necessário atualizar apenas uma das tabelas relacionadas (paciente/apoio) - nesse caso a de apoio.
    // dessa forma o proprio TypeORM cria os registros na tabela intermediária - usada em relacionamentos many to many.
    supportExists.pacientes = [...supportExists.pacientes, patientExists];

    await this.supportRepository.update(supportExists);

    return supportExists;
  }

  public async findAll() {
    const supports = await this.supportRepository.findAll();

    return supports;
  }

  public async findById(id: number) {
    const support = await this.supportRepository.findById(id);

    if (!support) {
      throw new NotFoundException('Apoio não encontrado.');
    }

    return support;
  }

  public async remove(id: number) {
    const supportExists = await this.supportRepository.findById(id);

    if (!supportExists) {
      throw new NotFoundException('Apoio não encontrado.');
    }

    const support = await this.supportRepository.remove(supportExists);

    return support;
  }
}
