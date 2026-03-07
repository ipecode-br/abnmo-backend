import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';

import type { AuthUserDto } from '../auth.dtos';

interface ChangePasswordUseCaseInput {
  user: AuthUserDto;
  password: string;
  newPassword: string;
}

@Injectable()
export class ChangePasswordUseCase {
  private readonly logger = new Logger(ChangePasswordUseCase.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly cryptographyService: CryptographyService,
  ) {}

  async execute({
    user,
    password,
    newPassword,
  }: ChangePasswordUseCaseInput): Promise<void> {
    const { id, role } = user;

    const entity: User | Patient | null =
      role === 'patient'
        ? await this.patientsRepository.findOne({ where: { id } })
        : await this.usersRepository.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (!entity.password) {
      this.logger.warn(
        { id, email: entity.email, role },
        'Change password failed: Entity does not have password',
      );
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

    this.logger.log(
      { id, email: entity.email, role },
      'Password changed successfully',
    );

    // Delete all tokens for this entity to ensure security after changing password
    await this.tokensRepository.delete({ entityId: entity.id });
  }
}
