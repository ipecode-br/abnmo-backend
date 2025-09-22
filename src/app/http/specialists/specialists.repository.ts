import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Specialist } from '@/domain/entities/specialist';
import { CreateSpecialistSchema } from '@/domain/schemas/specialist';

@Injectable()
export class SpecialistsRepository {
  constructor(
    @InjectRepository(Specialist)
    private readonly specialistsRepository: Repository<Specialist>,
  ) {}

  public async create(specialist: CreateSpecialistSchema): Promise<Specialist> {
    const specialistCreated = this.specialistsRepository.create(specialist);

    return await this.specialistsRepository.save(specialistCreated);
  }
}
