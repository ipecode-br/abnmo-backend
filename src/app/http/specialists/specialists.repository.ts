import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Specialist } from '@/domain/entities/specialist';

@Injectable()
export class SpecialistsRepository {
  constructor(
    @InjectRepository(Specialist)
    private readonly specialistRepository: Repository<Specialist>,
  ) {}
}
