import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';
import { Diagnosis } from './entities/diagnosis.entity';
import { DiagnosisRepository } from './diagnosis.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Diagnosis])],
  controllers: [DiagnosisController],
  providers: [DiagnosisService, DiagnosisRepository],
  exports: [DiagnosisRepository],
})
export class DiagnosisModule {}
