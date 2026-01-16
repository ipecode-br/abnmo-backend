import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  type FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  type Repository,
} from 'typeorm';

import { Appointment } from '@/domain/entities/appointment';
import type { AppointmentsOrderBy } from '@/domain/enums/appointments';
import type { AppointmentResponse } from '@/domain/schemas/appointments/responses';

import type { AuthUserDto } from '../../auth/auth.dtos';
import type { GetAppointmentsQuery } from '../appointments.dtos';

interface GetAppointmentsUseCaseRequest {
  user: AuthUserDto;
  query: GetAppointmentsQuery;
}

interface GetAppointmentsUseCaseResponse {
  appointments: AppointmentResponse[];
  total: number;
}

@Injectable()
export class GetAppointmentsUseCase {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  async execute({
    user,
    query,
  }: GetAppointmentsUseCaseRequest): Promise<GetAppointmentsUseCaseResponse> {
    const { search, status, category, condition, page, perPage } = query;
    const startDate = query.startDate ? new Date(query.startDate) : null;
    const endDate = query.endDate ? new Date(query.endDate) : null;

    const ORDER_BY_MAPPING: Record<AppointmentsOrderBy, keyof Appointment> = {
      date: 'created_at',
      patient: 'patient',
      status: 'status',
      category: 'category',
      condition: 'condition',
      professional: 'professional_name',
    };

    const where: FindOptionsWhere<Appointment> = {};

    if (user.role === 'patient') {
      where.patient = { id: user.id };
    }

    if (startDate && !endDate) {
      where.created_at = MoreThanOrEqual(startDate);
    }

    if (endDate && !startDate) {
      where.created_at = LessThanOrEqual(endDate);
    }

    if (startDate && endDate) {
      where.created_at = Between(startDate, endDate);
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (condition) {
      where.condition = condition;
    }

    if (search) {
      where.patient = { name: ILike(`%${search}%`) };
    }

    const total = await this.appointmentsRepository.count({ where });

    const orderBy = ORDER_BY_MAPPING[query.orderBy];
    const order =
      orderBy === 'patient'
        ? { patient: { name: query.order } }
        : { [orderBy]: query.order };

    const appointments = await this.appointmentsRepository.find({
      select: { patient: { id: true, name: true, avatar_url: true } },
      relations: { patient: true },
      skip: (page - 1) * perPage,
      take: perPage,
      order,
      where,
    });

    return { appointments, total };
  }
}
