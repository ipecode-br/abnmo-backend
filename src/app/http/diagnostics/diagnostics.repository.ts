import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Diagnostic } from '@/domain/entities/diagnostic';

import { CreateDiagnosticDto } from './dto/create-diagnostic.dto';

@Injectable()
export class DiagnosticsRepository {
  constructor(
    @InjectRepository(Diagnostic)
    private readonly diagnosticsRepository: Repository<Diagnostic>,
  ) {}

  public async findAll(): Promise<Diagnostic[]> {
    const diagnostics = await this.diagnosticsRepository.find({
      relations: ['pacientes'],
    });

    return diagnostics;
  }

  public async findById(id: number): Promise<Diagnostic | null> {
    const diagnostic = await this.diagnosticsRepository.findOne({
      where: {
        id_diagnostico: id,
      },
      relations: ['pacientes'],
    });

    return diagnostic;
  }

  public async create(diagnostic: CreateDiagnosticDto): Promise<Diagnostic> {
    const diagnosticCreated = this.diagnosticsRepository.create(diagnostic);

    const diagnosticSaved =
      await this.diagnosticsRepository.save(diagnosticCreated);

    return diagnosticSaved;
  }

  public async remove(diagnostic: Diagnostic): Promise<Diagnostic> {
    const diagnosticDeleted =
      await this.diagnosticsRepository.remove(diagnostic);

    return diagnosticDeleted;
  }
}
