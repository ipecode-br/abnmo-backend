import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/domain/entities/user';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  public async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find();

    return users;
  }

  public async findById(id: number): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: {
        id_usuario: id,
      },
    });

    return user;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: {
        email,
      },
    });

    return user;
  }

  public async create(user: CreateUserDto): Promise<User> {
    const userCreated = this.usersRepository.create(user);

    const userSaved = await this.usersRepository.save(userCreated);

    return userSaved;
  }

  public async update(user: UpdateUserDto): Promise<User> {
    const userUpdated = await this.usersRepository.save(user);

    return userUpdated;
  }

  public async remove(user: User): Promise<User> {
    const userDeleted = await this.usersRepository.remove(user);

    return userDeleted;
  }
}
