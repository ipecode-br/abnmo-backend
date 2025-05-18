import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsRepository } from './diagnostics.repository';
import { DiagnosticsService } from './diagnostics.service';
import { Diagnostic } from './entities/diagnostic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Diagnostic])],
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService, DiagnosticsRepository],
  exports: [DiagnosticsRepository],
})
export class DiagnosticsModule {}
