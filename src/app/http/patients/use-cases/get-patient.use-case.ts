import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { can } from '@/common/authorization/can';
import type { RequestUser } from '@/common/types';
import { User } from '@/domain/entities/user';
import { PatientDetailsResponse } from '@/domain/schemas/patients/responses';

interface GetPatientUseCaseInput {
  user: RequestUser;
  id: string;
}

@Injectable()
export class GetPatientUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async execute({
    user,
    id,
  }: GetPatientUseCaseInput): Promise<PatientDetailsResponse> {
    can(user, ['read:patient', 'read:patient:others'], id);

    const patient = await this.usersRepository.findOne({
      where: { id, role: 'patient' },
      relations: { survey: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        status: true,
        cpf: true,
        susId: true,
        supportContacts: true,
        updatedAt: true,
        createdAt: true,
        survey: {
          dateOfBirth: true,
          gender: true,
          race: true,
          maritalStatus: true,
          addressCep: true,
          addressState: true,
          addressCity: true,
          addressStreet: true,
          addressNumber: true,
          diagnosis: true,
          nmoMedications: true,
          generalMedications: true,
          hasVisualAlteration: true,
          usesVisualCane: true,
          usesWheelchair: true,
          hasMotorSequelae: true,
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.', {
        cause: `Patient ID <${id}> not found`,
      });
    }

    if (!patient.survey) {
      throw new NotFoundException('Cadastro do paciente não encontrado.', {
        cause: `Patient ID <${id}> has no survey`,
      });
    }

    return {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      avatarUrl: patient.avatarUrl,
      status: patient.status,
      cpf: patient.cpf,
      susId: patient.susId,
      supportContacts: patient.supportContacts,
      updatedAt: patient.updatedAt,
      createdAt: patient.createdAt,
      dateOfBirth: patient.survey.dateOfBirth,
      gender: patient.survey.gender,
      race: patient.survey.race,
      maritalStatus: patient.survey.maritalStatus,
      addressCep: patient.survey.addressCep,
      addressState: patient.survey.addressState,
      addressCity: patient.survey.addressCity,
      addressStreet: patient.survey.addressStreet,
      addressNumber: patient.survey.addressNumber,
      diagnosis: patient.survey.diagnosis,
      nmoMedications: patient.survey.nmoMedications,
      generalMedications: patient.survey.generalMedications,
      hasVisualAlteration: patient.survey.hasVisualAlteration,
      usesVisualCane: patient.survey.usesVisualCane,
      usesWheelchair: patient.survey.usesWheelchair,
      hasMotorSequelae: patient.survey.hasMotorSequelae,
    };
  }
}
