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
import { User } from '@/domain/entities/user';

import type { AuthUserDto, ChangePasswordDto } from '../auth.dtos';

interface ChangePasswordUseCaseInput {
  user: AuthUserDto;
  changePasswordDto: ChangePasswordDto;
}

@Injectable()
export class ChangePasswordUseCase {
  private readonly logger = new Logger(ChangePasswordUseCase.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly cryptographyService: CryptographyService,
  ) {}

  async execute({
    user,
    changePasswordDto,
  }: ChangePasswordUseCaseInput): Promise<void> {
    const { id, role } = user;
    const { password: currentPassword, new_password: newPassword } =
      changePasswordDto;

    const findOptions = {
      where: { id },
      select: { id: true, email: true, password: true },
    };

    const entity: {
      id: string;
      email: string;
      password: string | null;
    } | null =
      role === 'patient'
        ? await this.patientsRepository.findOne(findOptions)
        : await this.usersRepository.findOne(findOptions);

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
      currentPassword,
      entity.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Senha atual inválida.');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'A nova senha deve ser diferente da senha atual.',
      );
    }

    const password = await this.cryptographyService.createHash(newPassword);

    if (role === 'patient') {
      await this.patientsRepository.update({ id }, { password });
    } else {
      await this.usersRepository.update({ id }, { password });
    }

    this.logger.log(
      { id, email: entity.email, role },
      'Password changed successfully',
    );
  }
}
