import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { User } from '@/domain/entities/user';
import { PatientResponse } from '@/domain/schemas/patients/responses';

interface GetPatientUseCaseInput {
  id: string;
}

@Injectable()
export class GetPatientUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async execute({ id }: GetPatientUseCaseInput): Promise<PatientResponse> {
    const patient = await this.usersRepository.findOne({
      where: { id, role: 'patient' },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        status: true,
        cpf: true,
        susId: true,
        supportContacts: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.', {
        cause: `Patient ID <${id}> not found`,
      });
    }

    return {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      avatarUrl: patient.avatarUrl,
      status: patient.status,
      cpf: patient.cpf,
      susId: patient.susId,
      supportContacts: patient.supportContacts,
      updatedAt: patient.updatedAt,
      createdAt: patient.createdAt,
    };
  }
}
