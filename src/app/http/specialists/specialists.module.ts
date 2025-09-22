import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CryptographyModule } from '@/app/cryptography/cryptography.module';
import { Specialist } from '@/domain/entities/specialist';

import { UsersModule } from '../users/users.module';
import { SpecialistsController } from './specialists.controller';
import { SpecialistsRepository } from './specialists.repository';
import { SpecialistsService } from './specialists.service';
@Module({
  imports: [
    CryptographyModule,
    UsersModule,
    TypeOrmModule.forFeature([Specialist]),
  ],
  controllers: [SpecialistsController],
  providers: [SpecialistsService, SpecialistsRepository],
  exports: [SpecialistsRepository],
})
export class SpecialistsModule {}
