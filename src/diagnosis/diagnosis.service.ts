import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { Diagnosis } from './entities/diagnosis.entity';
import { DiagnosisRepository } from './diagnosis.repository';

@Injectable()
export class DiagnosisService {
  constructor(private readonly diagnosisRepository: DiagnosisRepository) {}

  async create(createDiagnosisDto: CreateDiagnosisDto): Promise<Diagnosis> {
    const diagnosis = this.diagnosisRepository.create({
      desc_diagnostico: createDiagnosisDto.desc_diagnostico,
    });

    return diagnosis;
  }

  async findAll(): Promise<Diagnosis[]> {
    const diagnosiss = await this.diagnosisRepository.findAll();

    return diagnosiss;
  }

  async findById(id: number): Promise<Diagnosis> {
    const diagnosis = await this.diagnosisRepository.findById(id);

    if (!diagnosis) {
      throw new NotFoundException('Diagnóstico não encontrado.');
    }

    return diagnosis;
  }

  async remove(id: number): Promise<Diagnosis> {
    const diagnosisExists = await this.diagnosisRepository.findById(id);

    if (!diagnosisExists) {
      throw new NotFoundException('Diagnóstico não encontrado.');
    }

    const diagnosis = await this.diagnosisRepository.remove(diagnosisExists);

    return diagnosis;
  }
}
