import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Hasher } from '@/domain/cryptography/hasher';
import type { User } from '@/domain/entities/user';

import type { CreateUserDto, UpdateUserDto } from './users.dtos';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly hasher: Hasher,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const userExists = await this.userRepository.findByEmail(
      createUserDto.email,
    );

    if (userExists) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    const hashPassword = await this.hasher.hash(createUserDto.password);
    createUserDto.password = hashPassword;

    return this.userRepository.create(createUserDto);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    Object.assign(user, updateUserDto);

    return await this.userRepository.update(user);
  }

  async remove(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return this.userRepository.remove(user);
  }
}
