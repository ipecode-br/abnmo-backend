import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Specialist } from '@/domain/entities/specialist';

import { SpecialistsController } from './specialists.controller';
import { SpecialistsRepository } from './specialists.repository';
import { SpecialistsService } from './specialists.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Specialist]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecret',
    }),
  ],
  controllers: [SpecialistsController],
  providers: [SpecialistsService, SpecialistsRepository],
  exports: [SpecialistsRepository],
})
export class SpecialistsModule {}
