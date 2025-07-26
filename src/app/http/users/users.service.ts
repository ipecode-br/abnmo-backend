import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { Hasher } from '@/domain/cryptography/hasher';
import type { User } from '@/domain/entities/user';

import type { CreateUserDto, UpdateUserDto } from './users.dtos';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly hasher: Hasher,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const userExists = await this.usersRepository.findByEmail(
      createUserDto.email,
    );

    if (userExists) {
      throw new ConflictException(
        'Já existe uma conta cadastrada com este e-mail. Tente fazer login ou clique em "Esqueceu sua senha?" para recuperar o acesso.',
      );
    }

    const hashPassword = await this.hasher.hash(createUserDto.password);
    createUserDto.password = hashPassword;

    const user = await this.usersRepository.create(createUserDto);

    this.logger.log(
      `Usuário registrado com sucesso: ${JSON.stringify({ id: user.id, email: user.email, timestamp: new Date() })}`,
    );

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    Object.assign(user, updateUserDto);

    return await this.usersRepository.update(user);
  }

  async remove(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return await this.usersRepository.remove(user);
  }

  async getProfile(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // IMPORTANT: DO NOT RETURN USER PASSWORD
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }
}
