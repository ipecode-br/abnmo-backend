import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/domain/entities/user';

import type { UpdateUserDto } from '../users.dtos';

interface UpdateUserUseCaseRequest {
  id: string;
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
    updateUserDto,
  }: UpdateUserUseCaseRequest): UpdateUserUseCaseResponse {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    Object.assign(user, updateUserDto);

    await this.usersRepository.save(user);

    this.logger.log(
      { userId: id, email: updateUserDto.email },
      'User updated successfully',
    );
  }
}
