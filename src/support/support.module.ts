import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { SupportRepository } from './support.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Support } from './entities/support.entity';
import { PatientModule } from 'src/patient/patient.module';

@Module({
  imports: [PatientModule, TypeOrmModule.forFeature([Support])],
  controllers: [SupportController],
  providers: [SupportService, SupportRepository],
})
export class SupportModule {}
