import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UserRepository } from './user.repository';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const userExists = await this.userRepository.findByEmail(
      createUserDto.email,
    );

    if (userExists) {
      throw new BadRequestException('Já existe um usuário com este e-mail.');
    }

    createUserDto.flag_login_facebook =
      createUserDto.flag_login_facebook ?? false;
    createUserDto.flag_login_gmail = createUserDto.flag_login_gmail ?? false;
    createUserDto.flag_ativo = createUserDto.flag_ativo ?? true;
    createUserDto.flag_deletado = createUserDto.flag_deletado ?? false;

    // Define a data de cadastro
    if (!createUserDto.data_cadastro) {
      createUserDto.data_cadastro = new Date();
    }

    const user = this.userRepository.create(createUserDto);

    return user;
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const userExists = await this.userRepository.findById(id);

    if (!userExists) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // Verifica se a senha foi enviada no update
    if (updateUserDto.senha) {
      const saltRounds = 10; // Define o fator de custo do bcrypt
      updateUserDto.senha = await bcrypt.hash(updateUserDto.senha, saltRounds);
    }

    // 🔹 Atualiza os campos alterados
    Object.assign(userExists, updateUserDto);

    const user = await this.userRepository.update(userExists);

    return user;
  }

  async remove(id: number): Promise<User> {
    const userExists = await this.userRepository.findById(id);

    if (!userExists) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const user = await this.userRepository.remove(userExists);

    return user;
  }
}
