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
import type { AppointmentOrderBy } from '@/domain/enums/appointments';
import type { AppointmentResponse } from '@/domain/schemas/appointments/responses';
import { UserSchema } from '@/domain/schemas/user';

import type { GetAppointmentsQuery } from '../appointments.dtos';

interface GetAppointmentsUseCaseRequest {
  user: UserSchema;
  query: GetAppointmentsQuery;
}

type GetAppointmentsUseCaseResponse = Promise<{
  appointments: AppointmentResponse[];
  total: number;
}>;

@Injectable()
export class GetAppointmentsUseCase {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  async execute({
    user,
    query,
  }: GetAppointmentsUseCaseRequest): GetAppointmentsUseCaseResponse {
    const { search, status, category, condition, page, perPage } = query;

    const ORDER_BY_MAPPING: Record<AppointmentOrderBy, keyof Appointment> = {
      date: 'created_at',
      patient: 'patient',
      status: 'status',
      category: 'category',
      condition: 'condition',
      professional: 'professional_name',
    };

    const where: FindOptionsWhere<Appointment> = {};
    const startDate = query.startDate ? new Date(query.startDate) : null;
    const endDate = query.endDate ? new Date(query.endDate) : null;

    if (user.role === 'patient') {
      where.patient = { user: { id: user.id } };
    }

    if (startDate && !endDate) {
      where.date = MoreThanOrEqual(startDate);
    }

    if (endDate && !startDate) {
      where.date = LessThanOrEqual(endDate);
    }

    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
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
      where.patient = { user: { name: ILike(`%${search}%`) } };
    }

    const total = await this.appointmentsRepository.count({ where });

    const orderBy = ORDER_BY_MAPPING[query.orderBy];
    const order =
      orderBy === 'patient'
        ? { patient: { user: { name: query.order } } }
        : { [orderBy]: query.order };

    const appointmentsQuery = await this.appointmentsRepository.find({
      relations: { patient: { user: true } },
      select: {
        patient: {
          id: true,
          user: { name: true, avatar_url: true },
        },
      },
      skip: (page - 1) * perPage,
      take: perPage,
      order,
      where,
    });

    const appointments = appointmentsQuery.map((appointment) => ({
      id: appointment.id,
      patient_id: appointment.patient_id,
      date: appointment.date,
      status: appointment.status,
      category: appointment.category,
      condition: appointment.condition,
      annotation: appointment.annotation,
      professional_name: appointment.professional_name,
      created_by: appointment.created_by,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at,
      patient: {
        name: appointment.patient.user.name,
        email: appointment.patient.user.email,
        avatar_url: appointment.patient.user.avatar_url,
      },
    }));

    return { appointments, total };
  }
}
