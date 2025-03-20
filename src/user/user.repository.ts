import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  public async findAll(): Promise<User[]> {
    const users = await this.userRepository.find();

    return users;
  }

  public async findById(id: number): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: {
        id_usuario: id,
      },
    });

    return user;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    return user;
  }

  public async create(user: CreateUserDto): Promise<User> {
    const userCreated = this.userRepository.create(user);

    const userSaved = await this.userRepository.save(userCreated);

    return userSaved;
  }

  public async update(user: UpdateUserDto): Promise<User> {
    const userUpdated = await this.userRepository.save(user);

    return userUpdated;
  }

  public async remove(user: User): Promise<User> {
    const userDeleted = await this.userRepository.remove(user);

    return userDeleted;
  }
}
