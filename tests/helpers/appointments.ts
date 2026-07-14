import { Appointment } from '@/domain/entities/appointment';

import { appointmentFactory } from '../config/factories/appointment.factory';
import { getTestDataSource } from '../config/setup-e2e';

export async function createAppointment(
  overrides: Partial<Appointment> & { patient: Appointment['patient'] },
): Promise<Appointment> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Appointment);
  const appointment = repo.create(appointmentFactory(overrides));

  await repo.save(appointment);

  return appointment;
}

export async function getAppointments(): Promise<Appointment[]> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Appointment);
  return await repo.find({
    relations: { patient: true },
    select: { patient: { id: true, name: true, email: true } },
  });
}

export async function getAppointmentById(
  id: string,
): Promise<Appointment | null> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Appointment);
  return await repo.findOne({ where: { id } });
}
