import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { UserSchema } from '@/domain/schemas/user';

import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './appointments.dtos';
import { AppointmentsRepository } from './appointments.repository';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
  ) {}

  public async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<void> {
    const { patient_id, specialist_id, date } = createAppointmentDto;
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    if (new Date(date) <= new Date()) {
      throw new BadRequestException(
        'A data do atendimento deve ser no futuro.',
      );
    }

    if (new Date(date) > threeMonthsFromNow) {
      throw new BadRequestException(
        'A data de atendimento deve estar dentro dos próximos 3 meses.',
      );
    }
    await this.appointmentsRepository.create({
      patient_id,
      specialist_id,
      date,
      status: 'scheduled',
    });

    this.logger.log(
      {
        patientId: patient_id,
        specialistId: specialist_id,
      },
      'Appointment created successfully',
    );
  }

  public async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
    user: UserSchema,
  ): Promise<void> {
    const appointment = await this.appointmentsRepository.findById(id);

    if (!appointment) {
      throw new NotFoundException('Atendimento não encontrado.');
    }

    if (appointment.status === 'canceled') {
      throw new BadRequestException(
        'Não é possível atualizar um atendimento cancelado.',
      );
    }

    Object.assign(appointment, updateAppointmentDto);

    await this.appointmentsRepository.update(appointment);

    this.logger.log(
      { id: appointment.id, user: user.id },
      'Appointment updated successfully.',
    );
  }

  async cancel(id: string, user: UserSchema): Promise<void> {
    const appointment = await this.appointmentsRepository.findById(id);

    if (!appointment) {
      throw new NotFoundException('Atendimento não encontrado.');
    }

    if (appointment.status === 'canceled') {
      throw new BadRequestException('Este atendimento já está cancelado.');
    }

    await this.appointmentsRepository.cancel(appointment.id);

    this.logger.log(
      { id: appointment.id, userId: user.id },
      'Appointment canceled successfully.',
    );
  }
}
