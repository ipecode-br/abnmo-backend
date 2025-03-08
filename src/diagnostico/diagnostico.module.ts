import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paciente } from '../paciente/entities/paciente.entity';
import { DiagnosticoController } from './diagnostico.controller';
import { DiagnosticoService } from './diagnostico.service';
import { Diagnostico } from './entities/diagnostico.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Paciente, Diagnostico])],
  controllers: [DiagnosticoController],
  providers: [DiagnosticoService],
})
export class DiagnosticoModule {}
