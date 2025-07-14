import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// import { DiagnosticsModule } from '@/app/http/diagnostics/diagnostics.module';
import { UsersModule } from '@/app/http/users/users.module';
import { Patient } from '@/domain/entities/patient';

import { PatientsController } from './patients.controller';
import { PatientsRepository } from './patients.repository';
import { PatientsService } from './patients.service';

@Module({
  imports: [
    UsersModule,
    // DiagnosticsModule,
    TypeOrmModule.forFeature([Patient]),
  ],
  controllers: [PatientsController],
  providers: [PatientsService, PatientsRepository],
  exports: [PatientsRepository],
})
export class PatientsModule {}
