import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Appointment } from '@/domain/entities/appointment';

@Injectable()
export class AppointmentsRepository {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  public async findById(id: string): Promise<Appointment | null> {
    return await this.appointmentsRepository.findOne({ where: { id } });
  }

  public async update(appointment: Appointment): Promise<Appointment> {
    return await this.appointmentsRepository.save(appointment);
  }

  public async cancel(id: string): Promise<Appointment> {
    return await this.appointmentsRepository.save({ id, status: 'canceled' });
  }
}
