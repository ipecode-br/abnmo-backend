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

import { can } from '@/common/authorization/can';
import type { RequestUser } from '@/common/types';
import { Appointment } from '@/domain/entities/appointment';
import type {
  AppointmentsOrderBy,
  AppointmentStatus,
} from '@/domain/enums/appointments';
import type { PatientCondition } from '@/domain/enums/patients';
import type { QueryOrder } from '@/domain/enums/queries';
import type { SpecialtyCategory } from '@/domain/enums/shared';
import type { AppointmentResponseSchema } from '@/domain/schemas/appointments/responses';

interface GetAppointmentsUseCaseInput {
  user: RequestUser;
  category?: SpecialtyCategory;
  condition?: PatientCondition;
  endDate?: string;
  limit?: number;
  order?: QueryOrder;
  orderBy?: AppointmentsOrderBy;
  page: number;
  patientId?: string;
  perPage: number;
  search?: string;
  startDate?: string;
  status?: AppointmentStatus;
}

interface GetAppointmentsUseCaseOutput {
  appointments: AppointmentResponseSchema[];
  total: number;
}

@Injectable()
export class GetAppointmentsUseCase {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  async execute({
    category,
    condition,
    limit,
    page,
    patientId,
    perPage,
    search,
    status,
    user,
    ...props
  }: GetAppointmentsUseCaseInput): Promise<GetAppointmentsUseCaseOutput> {
    can(user, ['read:appointment', 'read:appointment:others']);

    const ORDER_BY_MAPPING: Record<AppointmentsOrderBy, keyof Appointment> = {
      date: 'date',
      patient: 'patient',
      status: 'status',
      category: 'category',
      condition: 'condition',
      professional: 'professionalName',
    };

    const startDate = props.startDate ? new Date(props.startDate) : null;
    const endDate = props.endDate ? new Date(props.endDate) : null;

    const where: FindOptionsWhere<Appointment> = {};

    if (user.role === 'patient') {
      where.patient = { id: user.id };
    }

    if (patientId) {
      where.patient = { id: patientId };
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
      where.patient = { name: ILike(`%${search}%`) };
    }

    const total = await this.appointmentsRepository.count({ where });

    const orderBy = ORDER_BY_MAPPING[props.orderBy || 'date'];
    const order =
      orderBy === 'patient'
        ? { patient: { name: props.order } }
        : { [orderBy]: props.order };

    const appointments = await this.appointmentsRepository.find({
      select: {
        id: true,
        date: true,
        status: true,
        category: true,
        condition: true,
        annotation: true,
        professionalName: true,
        updatedAt: true,
        createdAt: true,
        patient: { id: true, name: true, email: true, avatarUrl: true },
        specialist: { id: true, name: true, email: true, avatarUrl: true },
      },
      relations: { patient: true, specialist: true },
      skip: (page - 1) * perPage,
      take: limit ?? perPage,
      order,
      where,
    });

    return {
      appointments: appointments.map((appointment) => ({
        id: appointment.id,
        date: appointment.date,
        status: appointment.status,
        category: appointment.category,
        condition: appointment.condition,
        annotation: appointment.annotation,
        professionalName: appointment.professionalName,
        updatedAt: appointment.updatedAt,
        createdAt: appointment.createdAt,
        patient: {
          id: appointment.patient.id,
          name: appointment.patient.name,
          email: appointment.patient.email,
          avatarUrl: appointment.patient.avatarUrl,
        },
        specialist: appointment.specialist
          ? {
              id: appointment.specialist.id,
              name: appointment.specialist.name,
              email: appointment.specialist.email,
              avatarUrl: appointment.specialist.avatarUrl,
            }
          : null,
      })),
      total,
    };
  }
}
