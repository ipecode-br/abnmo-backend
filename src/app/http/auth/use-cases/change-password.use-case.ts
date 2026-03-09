import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
import type { AuthUser } from '@/common/types';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';

interface ChangePasswordUseCaseInput {
  user: AuthUser;
  password: string;
  newPassword: string;
}

@Logger()
@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly cryptographyService: CryptographyService,
    private readonly logger: AppLogger,
  ) {}

  async execute({
    user,
    password,
    newPassword,
  }: ChangePasswordUseCaseInput): Promise<void> {
    this.logger.setEvent('change_password');

    const { id, role } = user;

    const entity: User | Patient | null =
      role === 'patient'
        ? await this.patientsRepository.findOne({ where: { id } })
        : await this.usersRepository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (!entity.password) {
      this.logger.warn('Change password failed: Entity does not have password');
      throw new BadRequestException('Usuário não encontrado.');
    }

    const passwordMatches = await this.cryptographyService.compareHash(
      password,
      entity.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Senha atual inválida.');
    }

    if (password === newPassword) {
      throw new BadRequestException(
        'A nova senha deve ser diferente da senha atual.',
      );
    }

    const passwordHash = await this.cryptographyService.createHash(newPassword);

    if (role === 'patient') {
      await this.patientsRepository.update({ id }, { password: passwordHash });
    } else {
      await this.usersRepository.update({ id }, { password: passwordHash });
    }

    this.logger.log('Password changed successfully');

    // Delete all tokens for this entity to ensure security after changing password
    await this.tokensRepository.delete({ entityId: entity.id });
  }
}
