import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/domain/entities/user';

import type { CreateUserDto, UpdateUserDto } from './users.dtos';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  public async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  public async findById(id: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id },
      relations: { patient: true },
    });
  }

  public async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
    });
  }

  public async create(user: CreateUserDto): Promise<User> {
    const userCreated = this.usersRepository.create(user);

    return await this.usersRepository.save(userCreated);
  }

  public async update(user: UpdateUserDto): Promise<User> {
    return await this.usersRepository.save(user);
  }

  public async remove(user: User): Promise<User> {
    return await this.usersRepository.remove(user);
  }
}
