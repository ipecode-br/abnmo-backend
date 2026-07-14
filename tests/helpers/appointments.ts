import { DataSource } from 'typeorm';

import { Appointment } from '@/domain/entities/appointment';

import { appointmentFactory } from '../config/factories/appointment.factory';

export async function createAppointment(
  dataSource: DataSource,
  overrides: Partial<Appointment> & { patient: Appointment['patient'] },
): Promise<Appointment> {
  const repo = dataSource.getRepository(Appointment);
  const appointment = repo.create(appointmentFactory(overrides));

  await repo.save(appointment);

  return appointment;
}

export async function getAppointment(
  dataSource: DataSource,
  id: string,
): Promise<Appointment | null> {
  const repo = dataSource.getRepository(Appointment);
  const appointment = await repo.findOne({ where: { id } });

  return appointment;
}
