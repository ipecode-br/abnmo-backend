// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';

// import type { Diagnostic } from '@/domain/entities/diagnostic';

// import { DiagnosticsRepository } from './diagnostics.repository';
// import { CreateDiagnosticDto } from './dto/create-diagnostic.dto';

// @Injectable()
// export class DiagnosticsService {
//   constructor(private readonly diagnosticsRepository: DiagnosticsRepository) {}

//   async create(createDiagnosticDto: CreateDiagnosticDto): Promise<Diagnostic> {
//     const diagnostic = await this.diagnosticsRepository.create({
//       desc_diagnostic: createDiagnosticDto.desc_diagnostic,
//     });
//     if (!diagnostic) {
//       throw new BadRequestException('Erro ao criar diagnóstico!');
//     }
//     return diagnostic;
//   }

//   async findAll(): Promise<Diagnostic[]> {
//     const diagnostics = await this.diagnosticsRepository.findAll();

//     return diagnostics;
//   }

//   async findById(id: number): Promise<Diagnostic> {
//     const diagnostic = await this.diagnosticsRepository.findById(id);

//     if (!diagnostic) {
//       throw new NotFoundException('Diagnóstico não encontrado.');
//     }

//     return diagnostic;
//   }

//   async remove(id: number): Promise<Diagnostic> {
//     const diagnosticExists = await this.diagnosticsRepository.findById(id);

//     if (!diagnosticExists) {
//       throw new NotFoundException('Diagnóstico não encontrado.');
//     }

//     const diagnostic =
//       await this.diagnosticsRepository.remove(diagnosticExists);

//     return diagnostic;
//   }
// }
