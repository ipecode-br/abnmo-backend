import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Specialist } from '@/domain/entities/specialist';

@Injectable()
export class SpecialistsRepository {
  constructor(
    @InjectRepository(Specialist)
    private readonly specialistsRepository: Repository<Specialist>,
  ) {}

  public async findById(id: string): Promise<Specialist | null> {
    return this.specialistsRepository.findOne({
      relations: { user: true, appointments: true },
      where: { id },
      select: {
        user: {
          name: true,
          email: true,
          avatar_url: true,
          role: true,
        },
      },
    });
  }
}
