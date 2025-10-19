import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Specialist } from '@/domain/entities/specialist';
import {
  SpecialistOrderByType,
  SpecialistType,
} from '@/domain/schemas/specialist';

import { FindAllSpecialistQueryDto } from './specialists.dtos';

@Injectable()
export class SpecialistsRepository {
  constructor(
    @InjectRepository(Specialist)
    private readonly specialistsRepository: Repository<Specialist>,
  ) {}

  public async findById(id: string): Promise<Specialist | null> {
    return await this.specialistsRepository.findOne({ where: { id } });
  }

  public async deactivate(id: string): Promise<Specialist> {
    return this.specialistsRepository.save({ id, status: 'inactive' });
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

  public async findAll(
    filters: FindAllSpecialistQueryDto,
  ): Promise<{ specialists: SpecialistType[]; total: number }> {
    const {
      search,
      order,
      orderBy,
      status,
      startDate,
      endDate,
      page,
      perPage,
    } = filters;

    const ORDER_BY: Record<SpecialistOrderByType, string> = {
      name: 'user.name',
      specialty: 'specialist.specialty',
      registry: 'specialist.registry',
      status: 'specialist.status',
      date: 'specialist.created_at',
    };

    const query = this.specialistsRepository
      .createQueryBuilder('specialist')
      .leftJoinAndSelect('specialist.user', 'user')
      .select(['specialist', 'user.name', 'user.email', 'user.avatar_url']);

    if (search) {
      query.andWhere(`user.name LIKE :search`, { search: `%${search}%` });
      query.orWhere(`specialist.specialty LIKE :search`, {
        search: `%${search}%`,
      });
      query.orWhere(`specialist.registry LIKE :search`, {
        search: `%${search}%`,
      });
    }

    if (status) {
      query.andWhere('specialist.status = :status', { status });
    }

    if (startDate && endDate) {
      query.andWhere('specialist.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (startDate && !endDate) {
      query.andWhere('specialist.created_at >= :startDate', { startDate });
    }

    const total = await query.getCount();

    query.orderBy(ORDER_BY[orderBy], order);
    query.skip((page - 1) * perPage).take(perPage);

    const rawSpecialists = await query.getMany();

    const specialists: SpecialistType[] = rawSpecialists.map(
      ({ user, ...specialistData }) => ({
        ...specialistData,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      }),
    );

    return { specialists, total };
  }
}
