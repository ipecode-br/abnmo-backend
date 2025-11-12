import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Appointment } from '@/domain/entities/appointment';
import type {
  AppointmentOrderByType,
  AppointmentStatusType,
  AppointmentType,
} from '@/domain/schemas/appointment';
import { UserSchema } from '@/domain/schemas/user';

import type {
  CreateAppointmentDto,
  FindAllAppointmentsQueryDto,
  UpdateAppointmentDto,
} from './appointments.dtos';

@Injectable()
export class AppointmentsRepository {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  public async findById(id: string): Promise<Appointment | null> {
    return await this.appointmentsRepository.findOne({ where: { id } });
  }

  async findAll(
    user: UserSchema,
    filters: FindAllAppointmentsQueryDto,
  ): Promise<{ appointments: AppointmentType[]; total: number }> {
    const {
      search,
      order,
      orderBy,
      status,
      startDate,
      endDate,
      page,
      perPage,
      limit,
    } = filters;

    const ORDER_BY: Record<AppointmentOrderByType, string> = {
      date: 'appointment.date',
      patient: 'appointment.patient_id',
      specialist: 'appointment.specialist_id',
      specialty: 'specialist.specialty',
      condition: 'appointment.condition',
    };

    const query = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.specialist', 'specialist')
      .leftJoinAndSelect('patient.user', 'patientUser')
      .leftJoinAndSelect('specialist.user', 'specialistUser');

    if (user.role === 'patient') {
      query.andWhere(`patient.user_id = :id`, { id: user.id });
    }

    if (user.role === 'specialist') {
      query.andWhere(`specialist.user_id = :id`, { id: user.id });
    }

    if (search) {
      query.andWhere(`patientUser.name LIKE :search`, {
        search: `%${search}%`,
      });
      query.orWhere(`specialistUser.name LIKE :search`, {
        search: `%${search}%`,
      });
    }

    if (status) {
      query.andWhere('appointment.status = :status', { status });
    }

    if (startDate && endDate) {
      query.andWhere('appointment.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (startDate && !endDate) {
      query.andWhere('appointment.created_at >= :startDate', { startDate });
    }

    const total = await query.getCount();

    query.orderBy(ORDER_BY[orderBy], order);

    if (limit) {
      query.limit(limit);
    }

    query.skip((page - 1) * perPage).take(perPage);

    const rawAppointments = await query.getMany();

    const appointments = rawAppointments.map((appointment) => ({
      id: appointment.id,
      patient_id: appointment.patient_id,
      specialist_id: appointment.specialist_id,
      date: appointment.date,
      status: appointment.status,
      condition: appointment.condition,
      annotation: appointment.annotation,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at,
      patient: {
        name: appointment.patient.user.name,
        email: appointment.patient.user.email,
        avatar_url: appointment.patient.user.avatar_url,
      },
      specialist: {
        name: appointment.specialist.user.name,
        email: appointment.specialist.user.email,
        avatar_url: appointment.specialist.user.avatar_url,
        specialty: appointment.specialist.specialty,
        registry: appointment.specialist.registry,
      },
    }));

    return { appointments, total };
  }

  public async create(
    createAppointmentDto: CreateAppointmentDto & {
      status: AppointmentStatusType;
    },
  ): Promise<Appointment> {
    const appointment =
      this.appointmentsRepository.create(createAppointmentDto);
    return await this.appointmentsRepository.save(appointment);
  }

  public async update(
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    return await this.appointmentsRepository.save(updateAppointmentDto);
  }

  public async cancel(id: string): Promise<Appointment> {
    return await this.appointmentsRepository.save({ id, status: 'canceled' });
  }
}
