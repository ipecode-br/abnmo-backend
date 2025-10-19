import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Appointment } from '@/domain/entities/appointment';
import type { AppointmentStatusType } from '@/domain/schemas/appointment';

import type {
  CreateAppointmentDto,
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
