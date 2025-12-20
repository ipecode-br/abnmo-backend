import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { User } from '@/domain/entities/user';

import type { CreateUserDto } from '../users.dtos';

interface CreateUserUseCaseRequest {
  createUserDto: CreateUserDto;
}

type CreateUserUseCaseResponse = Promise<User>;

@Injectable()
export class CreateUserUseCase {
  private readonly logger = new Logger(CreateUserUseCase.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly cryptographyService: CryptographyService,
  ) {}

  async execute({
    createUserDto,
  }: CreateUserUseCaseRequest): CreateUserUseCaseResponse {
    const { name, email, password } = createUserDto;

    const userExists = await this.usersRepository.findOne({ where: { email } });

    if (userExists) {
      throw new ConflictException(
        'Já existe uma conta cadastrada com este e-mail. Tente fazer login ou clique em "Esqueceu sua senha?" para recuperar o acesso.',
      );
    }

    const hashedPassword = await this.cryptographyService.createHash(password);

    const user = await this.usersRepository.save({
      name,
      email,
      password: hashedPassword,
    });

    this.logger.log({ userId: user.id, email }, 'User created successfully');

    return user;
  }
}
