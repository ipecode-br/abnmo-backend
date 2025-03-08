import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { validateDto } from 'src/common/utils/validation.util';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    console.log('Entrou no método createUser');

    createUserDto.flag_login_facebook =
      createUserDto.flag_login_facebook ?? false;
    createUserDto.flag_login_gmail = createUserDto.flag_login_gmail ?? false;
    createUserDto.flag_ativo = createUserDto.flag_ativo ?? true;
    createUserDto.flag_deletado = createUserDto.flag_deletado ?? false;

    console.log('flag deletado:', createUserDto.flag_deletado);
    await validateDto(createUserDto);

    console.log('DTO validado com sucesso');

    const userExistente = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (userExistente) {
      throw new BadRequestException('Já existe um usuário com este e-mail.');
    }
    console.log('flag deletado2:', createUserDto.flag_deletado);
    // Define a data de cadastro
    if (!createUserDto.data_cadastro) {
      createUserDto.data_cadastro = new Date();
    }
    console.log('flag deletado3:', createUserDto.flag_deletado);
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id_usuario: id },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    await validateDto(updateUserDto);

    const user = await this.findOne(id);

    // Verifica se a senha foi enviada no update
    if (updateUserDto.senha) {
      const saltRounds = 10; // Define o fator de custo do bcrypt
      updateUserDto.senha = await bcrypt.hash(updateUserDto.senha, saltRounds);
    }

    // 🔹 Atualiza os campos alterados
    Object.assign(user, updateUserDto);

    return await this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
