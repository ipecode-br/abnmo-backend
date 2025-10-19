import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Specialist } from '@/domain/entities/specialist';
import { SpecialistType } from '@/domain/schemas/specialist';

@Injectable()
export class SpecialistsRepository {
  constructor(
    @InjectRepository(Specialist)
    private readonly specialistsRepository: Repository<Specialist>,
  ) {}

  public async findById(id: string): Promise<Specialist | null> {
    return await this.specialistsRepository.findOne({ where: { id } });
  }

  public async findByIdWithRelations(
    id: string,
  ): Promise<SpecialistType | null> {
    const specialist = await this.specialistsRepository.findOne({
      relations: { user: true, appointments: true },
      where: { id },
      select: {
        user: { name: true, email: true, avatar_url: true },
      },
    });

    if (!specialist) return null;

    const { user, ...specialistData } = specialist;

    return {
      ...specialistData,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
    };
  }

  public async deactivate(id: string): Promise<Specialist> {
    return this.specialistsRepository.save({ id, status: 'inactive' });
  }
}
