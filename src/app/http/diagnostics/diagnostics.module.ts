import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Diagnostic } from '@/domain/entities/diagnostic';

import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsRepository } from './diagnostics.repository';
import { DiagnosticsService } from './diagnostics.service';

@Module({
  imports: [TypeOrmModule.forFeature([Diagnostic])],
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService, DiagnosticsRepository],
  exports: [DiagnosticsRepository],
})
export class DiagnosticsModule {}
