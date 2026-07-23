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

interface DeactivatePatientUseCaseInput {
  id: string;
  user: RequestUser;
}

@Injectable()
@Log()
export class DeactivatePatientUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly logger: LogService,
  ) {}

  async execute({ id, user }: DeactivatePatientUseCaseInput): Promise<void> {
    can(user, 'deactivate:patient');

    const patient = await this.usersRepository.findOne({
      select: { id: true, status: true },
      where: { id, role: 'patient' },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.', {
        cause: `Patient ID <${id}> not found`,
      });
    }

    if (patient.status === 'inactive') {
      throw new ConflictException('Este paciente já está inativo.', {
        cause: `Patient ID <${id}> already inactive`,
      });
    }

    await this.usersRepository.update(id, { status: 'inactive' });

    this.logger.log('Patient deactivated', { id });
  }
}
