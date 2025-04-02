import { InjectRepository } from '@nestjs/typeorm';
import { Diagnosis } from './entities/diagnosis.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';

@Injectable()
export class DiagnosisRepository {
  constructor(
    @InjectRepository(Diagnosis)
    private readonly diagnosisRepository: Repository<Diagnosis>,
  ) {}

  public async findAll(): Promise<Diagnosis[]> {
    const diagnosiss = await this.diagnosisRepository.find({
      relations: ['pacientes'],
    });

    return diagnosiss;
  }

  public async findById(id: number): Promise<Diagnosis | null> {
    const diagnosis = await this.diagnosisRepository.findOne({
      where: {
        id_diagnostico: id,
      },
      relations: ['pacientes'],
    });

    return diagnosis;
  }

  public async create(diagnosis: CreateDiagnosisDto): Promise<Diagnosis> {
    const diagnosisCreated = this.diagnosisRepository.create(diagnosis);

    const diagnosisSaved =
      await this.diagnosisRepository.save(diagnosisCreated);

    return diagnosisSaved;
  }

  public async remove(diagnosis: Diagnosis): Promise<Diagnosis> {
    const diagnosisDeleted = await this.diagnosisRepository.remove(diagnosis);

    return diagnosisDeleted;
  }
}
