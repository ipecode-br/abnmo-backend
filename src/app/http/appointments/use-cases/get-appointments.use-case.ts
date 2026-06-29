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

import type { RequestUser } from '@/common/types';
import { Appointment } from '@/domain/entities/appointment';
import type {
  AppointmentsOrderBy,
  AppointmentStatus,
} from '@/domain/enums/appointments';
import type { PatientCondition } from '@/domain/enums/patients';
import type { QueryOrder } from '@/domain/enums/queries';
import type { SpecialtyCategory } from '@/domain/enums/shared';

interface GetAppointmentsUseCaseInput {
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
  user: RequestUser;
}

interface GetAppointmentsUseCaseOutput {
  appointments: Appointment[];
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
    const startDate = props.startDate ? new Date(props.startDate) : null;
    const endDate = props.endDate ? new Date(props.endDate) : null;

    const ORDER_BY_MAPPING: Record<AppointmentsOrderBy, keyof Appointment> = {
      date: 'date',
      patient: 'patient',
      status: 'status',
      category: 'category',
      condition: 'condition',
      professional: 'professionalName',
    };

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
        patient: { id: true, name: true, avatarUrl: true },
        specialist: { id: true, name: true, avatarUrl: true, specialty: true },
      },
      relations: { patient: true, specialist: true },
      skip: (page - 1) * perPage,
      take: limit ?? perPage,
      order,
      where,
    });

    return { appointments, total };
  }
}
