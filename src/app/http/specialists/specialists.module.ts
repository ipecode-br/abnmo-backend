import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Specialist } from '@/domain/entities/specialist';

import { SpecialistsController } from './specialists.controller';
import { SpecialistsRepository } from './specialists.repository';
import { SpecialistsService } from './specialists.service';
@Module({
  imports: [TypeOrmModule.forFeature([Specialist])],
  controllers: [SpecialistsController],
  providers: [SpecialistsService, SpecialistsRepository],
  exports: [SpecialistsRepository],
})
export class SpecialistModule {}
