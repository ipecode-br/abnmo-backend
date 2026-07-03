import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { can } from '@/common/authorization/can';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { User } from '@/domain/entities/user';
import { SupportContact } from '@/domain/schemas/shared';

interface UpdatePatientUseCaseInput {
  user: RequestUser;
  id: string;
  name: string;
  phone: string | null;
  cpf: string;
  susId: string | null;
  supportContacts: SupportContact[];
}

@Injectable()
@Log()
export class UpdatePatientUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly logger: LogService,
  ) {}

  async execute({
    id,
    user,
    cpf,
    ...props
  }: UpdatePatientUseCaseInput): Promise<void> {
    can(user, 'update:patient', id);

    const patient = await this.usersRepository.findOne({
      select: { id: true, cpf: true },
      where: { id, role: 'patient' },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.', {
        cause: `Patient ID <${id}> not found`,
      });
    }

    if (cpf !== patient.cpf) {
      const patientWithSameCpf = await this.usersRepository.findOne({
        where: { cpf, role: 'patient' },
        select: { id: true },
      });

      if (patientWithSameCpf && patientWithSameCpf.id !== id) {
        throw new ConflictException('O CPF informado já está registrado.', {
          cause: `CPF <${cpf}> already exists`,
        });
      }
    }

    await this.usersRepository.update(id, { cpf, ...props });

    this.logger.log('Patient updated', { id });
  }
}
