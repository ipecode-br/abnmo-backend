import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/domain/entities/user';

import type { AuthUserDto } from '../../auth/auth.dtos';
import type { UpdateUserDto } from '../users.dtos';

interface UpdateUserUseCaseRequest {
  id: string;
  user: AuthUserDto;
  updateUserDto: UpdateUserDto;
}

type UpdateUserUseCaseResponse = Promise<void>;

@Injectable()
export class UpdateUserUseCase {
  private readonly logger = new Logger(UpdateUserUseCase.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async execute({
    id,
    user,
    updateUserDto,
  }: UpdateUserUseCaseRequest): UpdateUserUseCaseResponse {
    if (user.role !== 'admin' && user.id !== id) {
      this.logger.log(
        { id, userId: user.id, role: user.role },
        'Update user failed: User does not have permission to update this user',
      );
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este usuário.',
      );
    }

    const userToUpdate = await this.usersRepository.findOne({ where: { id } });

    if (!userToUpdate) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    Object.assign(userToUpdate, updateUserDto);

    await this.usersRepository.save(userToUpdate);

    this.logger.log(
      { id, email: updateUserDto.email },
      'User updated successfully',
    );
  }
}
